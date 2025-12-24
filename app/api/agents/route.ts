import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseClient } from '@/lib/supabase';
import { 
  Agent, 
  CreateAgentRequest,
  ApiResponse,
  isValidTemperature,
  isValidMaxTokens,
  isValidModelId
} from '@/types/database';

// GET /api/agents - List all agents for the authenticated user
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<Agent[]>>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { data: agents, error } = await supabaseClient
      .from('agents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch agents', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: agents || []
    });

  } catch (error) {
    console.error('GET /api/agents error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}

// POST /api/agents - Create a new agent
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<Agent>>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    let body: CreateAgentRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Validation
    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Agent name is required' },
        { status: 400 }
      );
    }

    if (body.name.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Agent name must be less than 100 characters' },
        { status: 400 }
      );
    }

    if (!body.system_prompt || body.system_prompt.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'System prompt is required' },
        { status: 400 }
      );
    }

    if (body.system_prompt.length > 5000) {
      return NextResponse.json(
        { success: false, error: 'System prompt must be less than 5000 characters' },
        { status: 400 }
      );
    }

    if (!body.model_id || !isValidModelId(body.model_id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid model ID' },
        { status: 400 }
      );
    }

    if (body.temperature !== undefined && !isValidTemperature(body.temperature)) {
      return NextResponse.json(
        { success: false, error: 'Temperature must be between 0 and 2' },
        { status: 400 }
      );
    }

    if (body.max_tokens !== undefined && !isValidMaxTokens(body.max_tokens)) {
      return NextResponse.json(
        { success: false, error: 'Max tokens must be between 1 and 4096' },
        { status: 400 }
      );
    }

    // Create agent
    const agentData = {
      user_id: userId,
      name: body.name.trim(),
      description: body.description?.trim() || null,
      system_prompt: body.system_prompt.trim(),
      model_id: body.model_id,
      temperature: body.temperature ?? 0.7,
      max_tokens: body.max_tokens ?? 512,
      avatar_color: body.avatar_color ?? '#8B5CF6',
      is_active: true
    };

    const { data: agent, error } = await supabaseClient
      .from('agents')
      .insert(agentData)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create agent', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, data: agent },
      { status: 201 }
    );

  } catch (error) {
    console.error('POST /api/agents error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}