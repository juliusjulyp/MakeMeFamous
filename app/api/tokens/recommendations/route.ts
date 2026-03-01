import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET /api/tokens/recommendations?token=0x...&limit=4
// "Users who bought X also bought Y" collaborative filtering
// Uses Postgres function for server-side aggregation
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenAddress = searchParams.get('token');
  const limit = Math.min(10, parseInt(searchParams.get('limit') || '4'));

  if (!tokenAddress) {
    return NextResponse.json({ error: 'Token address required' }, { status: 400 });
  }

  const supabase = createServerClient();

  try {
    const { data, error } = await supabase.rpc('get_token_recommendations', {
      p_token_address: tokenAddress,
      p_limit: limit,
    });

    if (error) {
      console.error('Recommendations RPC error:', error);
      return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Recommendations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
