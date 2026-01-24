import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET leaderboard data for tokens or creators
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'tokens'; // 'tokens' or 'creators'
  const sortBy = searchParams.get('sort') || 'volume'; // volume, trades, holders
  const limit = parseInt(searchParams.get('limit') || '20');

  const supabase = createServerClient();

  if (type === 'tokens') {
    return getTokenLeaderboard(supabase, sortBy, limit);
  } else if (type === 'creators') {
    return getCreatorLeaderboard(supabase, sortBy, limit);
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}

async function getTokenLeaderboard(supabase: any, sortBy: string, limit: number) {
  // Get all tokens
  const { data: tokens, error: tokensError } = await supabase
    .from('token_metadata')
    .select('*')
    .order('created_at', { ascending: false });

  if (tokensError) {
    return NextResponse.json({ error: 'Failed to fetch tokens' }, { status: 500 });
  }

  // Get trade stats for each token
  const tokenAddresses = tokens?.map((t: any) => t.token_address) || [];

  const { data: trades } = await supabase
    .from('trades')
    .select('token_address, type, volume, trader_address')
    .in('token_address', tokenAddresses);

  // Calculate stats for each token
  const tokenStats = (tokens || []).map((token: any) => {
    const tokenTrades = trades?.filter((t: any) => t.token_address === token.token_address) || [];
    const totalVolume = tokenTrades.reduce((sum: number, t: any) => sum + parseFloat(t.volume || '0'), 0);
    const tradeCount = tokenTrades.length;
    const uniqueTraders = new Set(tokenTrades.map((t: any) => t.trader_address)).size;

    // Calculate 24h stats
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recentTrades = tokenTrades.filter((t: any) => new Date(t.created_at) > dayAgo);
    const volume24h = recentTrades.reduce((sum: number, t: any) => sum + parseFloat(t.volume || '0'), 0);

    return {
      ...token,
      totalVolume,
      volume24h,
      tradeCount,
      holderCount: uniqueTraders,
      score: calculateTrendingScore(totalVolume, tradeCount, uniqueTraders, volume24h)
    };
  });

  // Sort based on criteria
  let sorted = [...tokenStats];
  switch (sortBy) {
    case 'volume':
      sorted.sort((a, b) => b.totalVolume - a.totalVolume);
      break;
    case 'volume24h':
      sorted.sort((a, b) => b.volume24h - a.volume24h);
      break;
    case 'trades':
      sorted.sort((a, b) => b.tradeCount - a.tradeCount);
      break;
    case 'holders':
      sorted.sort((a, b) => b.holderCount - a.holderCount);
      break;
    case 'trending':
      sorted.sort((a, b) => b.score - a.score);
      break;
    default:
      sorted.sort((a, b) => b.totalVolume - a.totalVolume);
  }

  const leaderboard = sorted.slice(0, limit).map((token, index) => ({
    rank: index + 1,
    tokenAddress: token.token_address,
    name: token.name,
    symbol: token.symbol,
    imageUrl: token.image_url,
    creatorAddress: token.creator_address,
    totalVolume: token.totalVolume.toString(),
    volume24h: token.volume24h.toString(),
    tradeCount: token.tradeCount,
    holderCount: token.holderCount,
    score: token.score
  }));

  // Platform totals
  const platformStats = {
    totalTokens: tokens?.length || 0,
    totalVolume: tokenStats.reduce((sum: number, t: any) => sum + t.totalVolume, 0).toString(),
    totalTrades: tokenStats.reduce((sum: number, t: any) => sum + t.tradeCount, 0),
    volume24h: tokenStats.reduce((sum: number, t: any) => sum + t.volume24h, 0).toString()
  };

  return NextResponse.json({ leaderboard, platformStats });
}

async function getCreatorLeaderboard(supabase: any, sortBy: string, limit: number) {
  // Get all tokens grouped by creator
  const { data: tokens } = await supabase
    .from('token_metadata')
    .select('*');

  // Get all trades
  const tokenAddresses = tokens?.map((t: any) => t.token_address) || [];
  const { data: trades } = await supabase
    .from('trades')
    .select('token_address, volume')
    .in('token_address', tokenAddresses);

  // Group by creator
  const creatorMap: Record<string, any> = {};

  for (const token of tokens || []) {
    const creator = token.creator_address;
    if (!creatorMap[creator]) {
      creatorMap[creator] = {
        address: creator,
        tokens: [],
        totalVolume: 0,
        totalTrades: 0,
        totalEarnings: 0
      };
    }
    creatorMap[creator].tokens.push(token);

    // Add trade stats for this token
    const tokenTrades = trades?.filter((t: any) => t.token_address === token.token_address) || [];
    const tokenVolume = tokenTrades.reduce((sum: number, t: any) => sum + parseFloat(t.volume || '0'), 0);
    creatorMap[creator].totalVolume += tokenVolume;
    creatorMap[creator].totalTrades += tokenTrades.length;
    creatorMap[creator].totalEarnings += tokenVolume * 0.01; // 1% creator fee
  }

  // Get user info for creators
  const creatorAddresses = Object.keys(creatorMap);
  const { data: users } = await supabase
    .from('users')
    .select('address, username, avatar_url')
    .in('address', creatorAddresses);

  const userMap: Map<string, any> = new Map(users?.map((u: any) => [u.address, u]) || []);

  // Build leaderboard
  let creators = Object.values(creatorMap).map((creator: any) => {
    const user = userMap.get(creator.address);
    return {
      ...creator,
      username: user?.username || null,
      avatar: user?.avatar_url || null,
      tokenCount: creator.tokens.length
    };
  });

  // Sort
  switch (sortBy) {
    case 'volume':
      creators.sort((a, b) => b.totalVolume - a.totalVolume);
      break;
    case 'tokens':
      creators.sort((a, b) => b.tokenCount - a.tokenCount);
      break;
    case 'earnings':
      creators.sort((a, b) => b.totalEarnings - a.totalEarnings);
      break;
    default:
      creators.sort((a, b) => b.totalVolume - a.totalVolume);
  }

  const leaderboard = creators.slice(0, limit).map((creator, index) => ({
    rank: index + 1,
    address: creator.address,
    username: creator.username,
    avatar: creator.avatar,
    tokenCount: creator.tokenCount,
    totalVolume: creator.totalVolume.toString(),
    totalTrades: creator.totalTrades,
    totalEarnings: creator.totalEarnings.toString()
  }));

  const platformStats = {
    totalCreators: creators.length,
    totalVolume: creators.reduce((sum, c) => sum + c.totalVolume, 0).toString(),
    totalTokens: tokens?.length || 0
  };

  return NextResponse.json({ leaderboard, platformStats });
}

// Trending score algorithm
function calculateTrendingScore(volume: number, trades: number, holders: number, volume24h: number): number {
  // Weight recent activity more heavily
  const volumeScore = Math.log10(volume + 1) * 10;
  const tradeScore = trades * 2;
  const holderScore = holders * 5;
  const recentScore = Math.log10(volume24h + 1) * 30; // 24h activity weighted 3x

  return volumeScore + tradeScore + holderScore + recentScore;
}
