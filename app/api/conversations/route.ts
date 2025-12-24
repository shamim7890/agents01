import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseClient } from '@/lib/supabase';
import { 
  ConversationWithAgent,
  ApiResponse
} from '@/types/database';

// GET /api/conversations - List all conversations for the authenticated user
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<ConversationWithAgent[]>>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get conversations with agent info
    const { data: conversations, error } = await supabaseClient
      .from('conversations')
      .select(`
        *,
        agent:agents(*)
      `)
      .eq('user_id', userId)
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch conversations', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: conversations || []
    });

  } catch (error) {
    console.error('GET /api/conversations error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}