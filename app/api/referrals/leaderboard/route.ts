import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET - Get referral leaderboard
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50');
  const sortBy = searchParams.get('sort') || 'earnings'; // earnings, referrals, volume

  const supabase = createServerClient();

  let orderColumn = 'total_earnings';
  if (sortBy === 'referrals') orderColumn = 'total_referrals';
  if (sortBy === 'volume') orderColumn = 'total_volume';

  // Get leaderboard from referral_stats
  const { data: leaders, error } = await supabase
    .from('referral_stats')
    .select('*')
    .order(orderColumn, { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }

  // Get user info for each leader
  const addresses = leaders?.map(l => l.referrer_address) || [];

  const { data: users } = await supabase
    .from('users')
    .select('address, username, avatar_url')
    .in('address', addresses);

  const userMap = new Map(users?.map(u => [u.address, u]) || []);

  const leaderboard = leaders?.map((leader, index) => ({
    rank: index + 1,
    address: leader.referrer_address,
    username: userMap.get(leader.referrer_address)?.username || null,
    avatar: userMap.get(leader.referrer_address)?.avatar_url || null,
    totalReferrals: leader.total_referrals || 0,
    totalVolume: leader.total_volume || '0',
    totalEarnings: leader.total_earnings || '0',
    pendingEarnings: leader.pending_earnings || '0'
  })) || [];

  // Get total platform stats
  const { data: totals } = await supabase
    .from('referral_stats')
    .select('total_referrals, total_volume, total_earnings');

  const platformStats = {
    totalReferrers: leaders?.length || 0,
    totalReferrals: totals?.reduce((sum, t) => sum + (t.total_referrals || 0), 0) || 0,
    totalVolume: totals?.reduce((sum, t) => sum + parseFloat(t.total_volume || '0'), 0).toString() || '0',
    totalEarnings: totals?.reduce((sum, t) => sum + parseFloat(t.total_earnings || '0'), 0).toString() || '0'
  };

  return NextResponse.json({
    leaderboard,
    platformStats
  });
}
