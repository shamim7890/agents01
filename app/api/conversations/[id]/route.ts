import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseClient } from '@/lib/supabase';
import { 
  ConversationWithMessages,
  ApiResponse
} from '@/types/database';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/conversations/[id] - Get conversation with messages
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<ConversationWithMessages>>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Get conversation
    const { data: conversation, error: convError } = await supabaseClient
      .from('conversations')
      .select(`
        *,
        agent:agents(*)
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (convError) {
      if (convError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Conversation not found' },
          { status: 404 }
        );
      }
      
      console.error('Supabase error:', convError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch conversation', details: convError.message },
        { status: 500 }
      );
    }

    // Get messages for this conversation
    const { data: messages, error: msgError } = await supabaseClient
      .from('messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    if (msgError) {
      console.error('Supabase error:', msgError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch messages', details: msgError.message },
        { status: 500 }
      );
    }

    const conversationWithMessages: ConversationWithMessages = {
      ...conversation,
      messages: messages || []
    };

    return NextResponse.json({
      success: true,
      data: conversationWithMessages
    });

  } catch (error) {
    console.error('GET /api/conversations/[id] error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE /api/conversations/[id] - Delete conversation
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<{ id: string }>>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Delete conversation (messages will cascade delete)
    const { error } = await supabaseClient
      .from('conversations')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete conversation', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { id }
    });

  } catch (error) {
    console.error('DELETE /api/conversations/[id] error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}