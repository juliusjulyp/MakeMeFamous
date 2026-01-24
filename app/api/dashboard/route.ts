import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET creator dashboard stats
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: 'Address required' }, { status: 400 });
  }

  const supabase = createServerClient();
  const normalizedAddress = address.toLowerCase();

  // Get all tokens created by this address
  const { data: tokens, error: tokensError } = await supabase
    .from('token_metadata')
    .select('*')
    .eq('creator_address', normalizedAddress)
    .order('created_at', { ascending: false });

  if (tokensError) {
    return NextResponse.json({ error: 'Failed to fetch tokens' }, { status: 500 });
  }

  // Get trade history for all creator's tokens
  const tokenAddresses = tokens?.map(t => t.token_address) || [];

  const { data: trades } = await supabase
    .from('trades')
    .select('*')
    .in('token_address', tokenAddresses)
    .order('created_at', { ascending: false })
    .limit(100);

  // Calculate stats for each token
  const tokenStats = await Promise.all((tokens || []).map(async (token) => {
    // Get trades for this token
    const tokenTrades = trades?.filter(t => t.token_address === token.token_address) || [];

    // Calculate total volume and creator earnings (1% of volume)
    const totalVolume = tokenTrades.reduce((sum, t) => sum + parseFloat(t.volume || '0'), 0);
    const creatorEarnings = totalVolume * 0.01; // 1% creator fee

    // Count unique holders from trades (approximate)
    const uniqueBuyers = new Set(tokenTrades.filter(t => t.type === 'buy').map(t => t.trader_address));

    return {
      ...token,
      totalVolume: totalVolume.toString(),
      creatorEarnings: creatorEarnings.toString(),
      tradeCount: tokenTrades.length,
      holderCount: uniqueBuyers.size,
      recentTrades: tokenTrades.slice(0, 10)
    };
  }));

  // Aggregate stats
  const totalVolume = tokenStats.reduce((sum, t) => sum + parseFloat(t.totalVolume), 0);
  const totalEarnings = tokenStats.reduce((sum, t) => sum + parseFloat(t.creatorEarnings), 0);
  const totalTrades = tokenStats.reduce((sum, t) => sum + t.tradeCount, 0);

  return NextResponse.json({
    tokens: tokenStats,
    summary: {
      tokenCount: tokens?.length || 0,
      totalVolume: totalVolume.toString(),
      totalEarnings: totalEarnings.toString(),
      totalTrades,
      pendingEarnings: totalEarnings.toString() // For now, all earnings are "pending" until claimed
    },
    recentTrades: trades?.slice(0, 20) || []
  });
}
