import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET /api/tokens/analytics?token=0x...
// Detailed analytics for a single token
// Uses Postgres function for server-side aggregation
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenAddress = searchParams.get('token');

  if (!tokenAddress) {
    return NextResponse.json({ error: 'Token address required' }, { status: 400 });
  }

  const supabase = createServerClient();

  try {
    const { data, error } = await supabase.rpc('get_token_analytics', {
      p_token_address: tokenAddress,
    });

    if (error) {
      console.error('Analytics RPC error:', error);
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
