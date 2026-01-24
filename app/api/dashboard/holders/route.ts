import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET top holders for a token
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenAddress = searchParams.get('token');
  const limit = parseInt(searchParams.get('limit') || '20');

  if (!tokenAddress) {
    return NextResponse.json({ error: 'Token address required' }, { status: 400 });
  }

  const supabase = createServerClient();
  const normalizedToken = tokenAddress.toLowerCase();

  // Get all trades for this token
  const { data: trades } = await supabase
    .from('trades')
    .select('*')
    .eq('token_address', normalizedToken)
    .order('created_at', { ascending: true });

  if (!trades || trades.length === 0) {
    return NextResponse.json({ holders: [], totalHolders: 0 });
  }

  // Calculate balances from trades
  const balances: Record<string, number> = {};

  for (const trade of trades) {
    const address = trade.trader_address;
    if (!balances[address]) {
      balances[address] = 0;
    }

    if (trade.type === 'buy') {
      balances[address] += parseFloat(trade.token_amount || '0');
    } else if (trade.type === 'sell') {
      balances[address] -= parseFloat(trade.token_amount || '0');
    }
  }

  // Filter out zero/negative balances and sort by balance
  const holders = Object.entries(balances)
    .filter(([_, balance]) => balance > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([address, balance], index) => ({
      rank: index + 1,
      address,
      balance: balance.toString(),
      percentage: '0' // Will calculate if we have total supply
    }));

  // Calculate percentages
  const totalHeld = holders.reduce((sum, h) => sum + parseFloat(h.balance), 0);
  holders.forEach(h => {
    h.percentage = ((parseFloat(h.balance) / totalHeld) * 100).toFixed(2);
  });

  // Get user info for holders
  const addresses = holders.map(h => h.address);
  const { data: users } = await supabase
    .from('users')
    .select('address, username, avatar_url')
    .in('address', addresses);

  const userMap = new Map(users?.map(u => [u.address, u]) || []);

  const holdersWithInfo = holders.map(h => ({
    ...h,
    username: userMap.get(h.address)?.username || null,
    avatar: userMap.get(h.address)?.avatar_url || null
  }));

  return NextResponse.json({
    holders: holdersWithInfo,
    totalHolders: Object.values(balances).filter(b => b > 0).length
  });
}
