import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// POST - Record a trade
export async function POST(request: NextRequest) {
  try {
    const {
      tokenAddress,
      traderAddress,
      type, // 'buy' or 'sell'
      tokenAmount,
      maticAmount,
      txHash
    } = await request.json();

    if (!tokenAddress || !traderAddress || !type || !tokenAmount || !maticAmount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createServerClient();

    const { data: trade, error } = await supabase
      .from('trades')
      .insert({
        token_address: tokenAddress.toLowerCase(),
        trader_address: traderAddress.toLowerCase(),
        type,
        token_amount: tokenAmount,
        volume: maticAmount, // MATIC volume
        tx_hash: txHash || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Trade recording error:', error);
      return NextResponse.json({ error: 'Failed to record trade' }, { status: 500 });
    }

    return NextResponse.json({ trade });
  } catch (error) {
    console.error('Trade error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// GET - Get trades for a token or user
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenAddress = searchParams.get('token');
  const traderAddress = searchParams.get('trader');
  const limit = parseInt(searchParams.get('limit') || '50');

  const supabase = createServerClient();

  let query = supabase
    .from('trades')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (tokenAddress) {
    query = query.eq('token_address', tokenAddress.toLowerCase());
  }

  if (traderAddress) {
    query = query.eq('trader_address', traderAddress.toLowerCase());
  }

  const { data: trades, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch trades' }, { status: 500 });
  }

  return NextResponse.json({ trades: trades || [] });
}
