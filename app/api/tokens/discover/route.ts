import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET /api/tokens/discover - Server-side token discovery with filtering, sorting, pagination
// Uses Postgres function for server-side aggregation
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const category = searchParams.get('category') || null;
  const search = searchParams.get('search') || null;
  const sortBy = searchParams.get('sort') || 'trending';
  const minVolume = parseFloat(searchParams.get('minVolume') || '0');
  const minHolders = parseInt(searchParams.get('minHolders') || '0');
  const maxAge = parseInt(searchParams.get('maxAge') || '0');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
  const userAddress = searchParams.get('user') || null;

  const supabase = createServerClient();

  try {
    const { data, error } = await supabase.rpc('discover_tokens', {
      p_category: category,
      p_search: search,
      p_sort_by: sortBy,
      p_min_volume: minVolume,
      p_min_holders: minHolders,
      p_max_age_days: maxAge,
      p_page: page,
      p_limit: limit,
      p_user_address: userAddress,
    });

    if (error) {
      console.error('Discovery RPC error:', error);
      return NextResponse.json({ error: 'Failed to fetch tokens' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Discovery error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
