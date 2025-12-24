import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseClient } from '@/lib/supabase';
import { 
  Message,
  Conversation,
  ChatResponse,
  ApiResponse
} from '@/types/database';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

interface ChatRequest {
  message: string;
  conversation_id?: string;
}

interface HuggingFaceMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface HuggingFaceChatRequest {
  model: string;
  messages: HuggingFaceMessage[];
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}

interface HuggingFaceChoice {
  message: {
    role: string;
    content: string;
  };
  finish_reason: string;
  index: number;
}

interface HuggingFaceChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: HuggingFaceChoice[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  error?: string;
  estimated_time?: number;
}

const MAX_CONTEXT_MESSAGES = 20; // Keep last 20 messages for context

// POST /api/agents/[id]/chat - Send message to agent
export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<ChatResponse>>> {
  const startTime = Date.now();
  
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: agentId } = await params;

    // Parse request body
    let body: ChatRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const userMessage = body.message?.trim();
    if (!userMessage) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    if (userMessage.length > 10000) {
      return NextResponse.json(
        { success: false, error: 'Message must be less than 10,000 characters' },
        { status: 400 }
      );
    }

    // Get agent configuration
    const { data: agent, error: agentError } = await supabaseClient
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .eq('user_id', userId)
      .single();

    if (agentError || !agent) {
      return NextResponse.json(
        { success: false, error: 'Agent not found' },
        { status: 404 }
      );
    }

    if (!agent.is_active) {
      return NextResponse.json(
        { success: false, error: 'Agent is inactive' },
        { status: 400 }
      );
    }

    // Get or create conversation
    let conversation: Conversation;
    let conversationHistory: Message[] = [];

    if (body.conversation_id) {
      // Get existing conversation
      const { data: existingConv, error: convError } = await supabaseClient
        .from('conversations')
        .select('*')
        .eq('id', body.conversation_id)
        .eq('user_id', userId)
        .eq('agent_id', agentId)
        .single();

      if (convError || !existingConv) {
        return NextResponse.json(
          { success: false, error: 'Conversation not found' },
          { status: 404 }
        );
      }

      conversation = existingConv;

      // Get conversation history (last N messages for context)
      const { data: messages, error: msgError } = await supabaseClient
        .from('messages')
        .select('*')
        .eq('conversation_id', body.conversation_id)
        .order('created_at', { ascending: false })
        .limit(MAX_CONTEXT_MESSAGES);

      if (!msgError && messages) {
        conversationHistory = messages.reverse();
      }
    } else {
      // Create new conversation
      const { data: newConv, error: convError } = await supabaseClient
        .from('conversations')
        .insert({
          agent_id: agentId,
          user_id: userId,
          title: userMessage.substring(0, 100), // Use first message as title
          last_message_at: new Date().toISOString()
        })
        .select()
        .single();

      if (convError || !newConv) {
        console.error('Failed to create conversation:', convError);
        return NextResponse.json(
          { success: false, error: 'Failed to create conversation', details: convError?.message },
          { status: 500 }
        );
      }

      conversation = newConv;
    }

    // Save user message to database
    const { data: savedUserMessage, error: userMsgError } = await supabaseClient
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        role: 'user',
        content: userMessage,
        tokens_used: 0,
        processing_time: 0
      })
      .select()
      .single();

    if (userMsgError || !savedUserMessage) {
      console.error('Failed to save user message:', userMsgError);
      return NextResponse.json(
        { success: false, error: 'Failed to save message', details: userMsgError?.message },
        { status: 500 }
      );
    }

    // Build messages array for HuggingFace API
    const messages: HuggingFaceMessage[] = [];

    // Add system prompt
    messages.push({
      role: 'system',
      content: agent.system_prompt
    });

    // Add conversation history
    for (const msg of conversationHistory) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      }
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: userMessage
    });

    // Call Hugging Face API
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API key not configured' },
        { status: 500 }
      );
    }

    const apiUrl = 'https://router.huggingface.co/v1/chat/completions';
    const requestBody: HuggingFaceChatRequest = {
      model: agent.model_id,
      messages,
      max_tokens: agent.max_tokens,
      temperature: agent.temperature,
      stream: false
    };

    const hfResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await hfResponse.text();

    // Handle model loading (503)
    if (hfResponse.status === 503) {
      let data: { estimated_time?: number };
      try {
        data = JSON.parse(responseText);
      } catch {
        data = { estimated_time: 20 };
      }
      const waitTime = data.estimated_time || 20;
      return NextResponse.json(
        { 
          success: false, 
          error: `Model is loading. Please wait ${Math.ceil(waitTime)} seconds and try again.`
        },
        { status: 503 }
      );
    }

    if (!hfResponse.ok) {
      console.error('HuggingFace API error:', responseText);
      return NextResponse.json(
        { success: false, error: 'Failed to generate response', details: responseText.substring(0, 200) },
        { status: hfResponse.status }
      );
    }

    // Parse response
    let hfData: HuggingFaceChatResponse;
    try {
      hfData = JSON.parse(responseText);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid response from AI service' },
        { status: 500 }
      );
    }

    if (!hfData.choices || hfData.choices.length === 0 || !hfData.choices[0].message?.content) {
      return NextResponse.json(
        { success: false, error: 'Invalid response structure from AI service' },
        { status: 500 }
      );
    }

    const assistantResponse = hfData.choices[0].message.content.trim();
    const tokensUsed = hfData.usage?.total_tokens || 0;
    const processingTime = Date.now() - startTime;

    // Save assistant response to database
    const { data: savedAssistantMessage, error: assistantMsgError } = await supabaseClient
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        role: 'assistant',
        content: assistantResponse,
        tokens_used: tokensUsed,
        processing_time: processingTime
      })
      .select()
      .single();

    if (assistantMsgError || !savedAssistantMessage) {
      console.error('Failed to save assistant message:', assistantMsgError);
      return NextResponse.json(
        { success: false, error: 'Failed to save response', details: assistantMsgError?.message },
        { status: 500 }
      );
    }

    // Update conversation last_message_at
    await supabaseClient
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversation.id);

    return NextResponse.json({
      success: true,
      data: {
        message: savedAssistantMessage,
        conversation,
        tokens_used: tokensUsed,
        processing_time: processingTime
      }
    });

  } catch (error) {
    console.error('POST /api/agents/[id]/chat error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}