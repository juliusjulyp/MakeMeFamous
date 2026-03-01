import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET /api/activity - Platform-wide activity feed
// Uses Postgres function for server-side joins and filtering
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'all';
  const tokenAddress = searchParams.get('token') || null;
  const following = searchParams.get('following');
  const limit = Math.min(50, parseInt(searchParams.get('limit') || '30'));
  const before = searchParams.get('before') || null;

  // Convert comma-separated following string to array for Postgres
  const followingArray = following
    ? following.split(',').map(a => a.toLowerCase())
    : null;

  const supabase = createServerClient();

  try {
    const { data, error } = await supabase.rpc('get_activity_feed', {
      p_type: type,
      p_token: tokenAddress,
      p_following: followingArray,
      p_limit: limit,
      p_before: before,
    });

    if (error) {
      console.error('Activity feed RPC error:', error);
      return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Activity feed error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
