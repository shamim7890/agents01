import { NextRequest, NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabase';
import { AgentTemplate, ApiResponse } from '@/types/database';

// GET /api/templates - Get all public agent templates
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<AgentTemplate[]>>> {
  try {
    const { data: templates, error } = await supabaseClient
      .from('agent_templates')
      .select('*')
      .eq('is_public', true)
      .order('category', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch templates', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: templates || []
    });

  } catch (error) {
    console.error('GET /api/templates error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}