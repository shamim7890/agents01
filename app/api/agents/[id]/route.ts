import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseClient } from '@/lib/supabase';
import { 
  Agent, 
  UpdateAgentRequest,
  ApiResponse,
  isValidTemperature,
  isValidMaxTokens,
  isValidModelId
} from '@/types/database';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/agents/[id] - Get single agent
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<Agent>>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const { data: agent, error } = await supabaseClient
      .from('agents')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Agent not found' },
          { status: 404 }
        );
      }
      
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch agent', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: agent
    });

  } catch (error) {
    console.error('GET /api/agents/[id] error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}

// PATCH /api/agents/[id] - Update agent
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<Agent>>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;

    let body: UpdateAgentRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Validation
    if (body.name !== undefined) {
      if (body.name.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: 'Agent name cannot be empty' },
          { status: 400 }
        );
      }
      if (body.name.length > 100) {
        return NextResponse.json(
          { success: false, error: 'Agent name must be less than 100 characters' },
          { status: 400 }
        );
      }
    }

    if (body.system_prompt !== undefined) {
      if (body.system_prompt.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: 'System prompt cannot be empty' },
          { status: 400 }
        );
      }
      if (body.system_prompt.length > 5000) {
        return NextResponse.json(
          { success: false, error: 'System prompt must be less than 5000 characters' },
          { status: 400 }
        );
      }
    }

    if (body.model_id !== undefined && !isValidModelId(body.model_id)) {
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

    // Build update object
    const updateData: Partial<Agent> = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.description !== undefined) updateData.description = body.description.trim() || null;
    if (body.system_prompt !== undefined) updateData.system_prompt = body.system_prompt.trim();
    if (body.model_id !== undefined) updateData.model_id = body.model_id;
    if (body.temperature !== undefined) updateData.temperature = body.temperature;
    if (body.max_tokens !== undefined) updateData.max_tokens = body.max_tokens;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    if (body.avatar_color !== undefined) updateData.avatar_color = body.avatar_color;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Update agent
    const { data: agent, error } = await supabaseClient
      .from('agents')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Agent not found' },
          { status: 404 }
        );
      }
      
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update agent', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: agent
    });

  } catch (error) {
    console.error('PATCH /api/agents/[id] error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE /api/agents/[id] - Delete agent
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

    // Delete agent (conversations and messages will cascade delete)
    const { error } = await supabaseClient
      .from('agents')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete agent', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { id }
    });

  } catch (error) {
    console.error('DELETE /api/agents/[id] error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}