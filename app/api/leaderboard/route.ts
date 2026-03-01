import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET leaderboard data for tokens or creators
// Uses Postgres functions for server-side aggregation
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'tokens';
  const sortBy = searchParams.get('sort') || 'volume';
  const limit = parseInt(searchParams.get('limit') || '20');

  const supabase = createServerClient();

  try {
    if (type === 'tokens') {
      const { data, error } = await supabase.rpc('get_token_leaderboard', {
        p_sort_by: sortBy,
        p_limit: limit,
      });

      if (error) {
        console.error('Token leaderboard RPC error:', error);
        return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
      }

      return NextResponse.json(data);
    } else if (type === 'creators') {
      const { data, error } = await supabase.rpc('get_creator_leaderboard', {
        p_sort_by: sortBy,
        p_limit: limit,
      });

      if (error) {
        console.error('Creator leaderboard RPC error:', error);
        return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
      }

      return NextResponse.json(data);
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
