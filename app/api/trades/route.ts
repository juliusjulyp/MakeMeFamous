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

    // Check and trigger price alerts for this token
    try {
      const tradePrice = parseFloat(maticAmount) / parseFloat(tokenAmount || '1');
      if (tradePrice > 0) {
        const { data: activeAlerts } = await supabase
          .from('price_alerts')
          .select('id, target_price, direction')
          .eq('token_address', tokenAddress.toLowerCase())
          .eq('is_active', true);

        if (activeAlerts && activeAlerts.length > 0) {
          const triggeredIds: string[] = [];
          for (const alert of activeAlerts) {
            const target = parseFloat(alert.target_price);
            if (
              (alert.direction === 'above' && tradePrice >= target) ||
              (alert.direction === 'below' && tradePrice <= target)
            ) {
              triggeredIds.push(alert.id);
            }
          }
          if (triggeredIds.length > 0) {
            await supabase
              .from('price_alerts')
              .update({ is_active: false, triggered_at: new Date().toISOString() })
              .in('id', triggeredIds);
          }
        }
      }
    } catch (alertError) {
      // Don't fail the trade if alert check fails
      console.error('Alert check error:', alertError);
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
