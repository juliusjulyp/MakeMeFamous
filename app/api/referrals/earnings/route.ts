import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

const REFERRAL_COMMISSION_RATE = 0.005; // 0.5% of trade volume

// POST - Track referral earnings after a trade
export async function POST(request: NextRequest) {
  try {
    const { traderAddress, tokenAddress, tradeVolume, txHash } = await request.json();

    if (!traderAddress || !tokenAddress || !tradeVolume) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createServerClient();
    const normalizedTrader = traderAddress.toLowerCase();
    const normalizedToken = tokenAddress.toLowerCase();
    const volume = parseFloat(tradeVolume);

    // Check if trader was referred by someone
    const { data: referral } = await supabase
      .from('referrals')
      .select('referrer_address')
      .eq('referred_address', normalizedTrader)
      .single();

    if (!referral) {
      // User wasn't referred, no earnings to track
      return NextResponse.json({ tracked: false, reason: 'No referrer' });
    }

    const earningAmount = volume * REFERRAL_COMMISSION_RATE;

    // Record the earning
    const { error: earningError } = await supabase
      .from('referral_earnings')
      .insert({
        referrer_address: referral.referrer_address,
        referred_address: normalizedTrader,
        token_address: normalizedToken,
        trade_volume: volume.toString(),
        earning_amount: earningAmount.toString(),
        tx_hash: txHash || null,
        is_claimed: false
      });

    if (earningError) {
      console.error('Failed to insert earning:', earningError);
    }

    // Update referrer's stats
    const { data: existingStats } = await supabase
      .from('referral_stats')
      .select('*')
      .eq('referrer_address', referral.referrer_address)
      .single();

    if (existingStats) {
      // Update existing stats
      await supabase
        .from('referral_stats')
        .update({
          total_volume: (parseFloat(existingStats.total_volume || '0') + volume).toString(),
          total_earnings: (parseFloat(existingStats.total_earnings || '0') + earningAmount).toString(),
          pending_earnings: (parseFloat(existingStats.pending_earnings || '0') + earningAmount).toString(),
          updated_at: new Date().toISOString()
        })
        .eq('referrer_address', referral.referrer_address);
    } else {
      // Create new stats record
      await supabase
        .from('referral_stats')
        .insert({
          referrer_address: referral.referrer_address,
          total_referrals: 1,
          total_volume: volume.toString(),
          total_earnings: earningAmount.toString(),
          pending_earnings: earningAmount.toString(),
          claimed_earnings: '0'
        });
    }

    // Update referral record with volume
    const { data: refRecord } = await supabase
      .from('referrals')
      .select('total_volume')
      .eq('referred_address', normalizedTrader)
      .single();

    await supabase
      .from('referrals')
      .update({
        total_volume: (parseFloat(refRecord?.total_volume || '0') + volume).toString()
      })
      .eq('referred_address', normalizedTrader);

    return NextResponse.json({
      tracked: true,
      referrer: referral.referrer_address,
      volume: volume.toString(),
      earning: earningAmount.toString()
    });
  } catch (error) {
    console.error('Referral earnings error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// GET - Get earnings history for a referrer
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: 'Address required' }, { status: 400 });
  }

  const supabase = createServerClient();
  const normalizedAddress = address.toLowerCase();

  // Get all earnings
  const { data: earnings } = await supabase
    .from('referral_earnings')
    .select('*')
    .eq('referrer_address', normalizedAddress)
    .order('created_at', { ascending: false })
    .limit(100);

  // Get pending vs claimed totals
  const pending = earnings?.filter(e => !e.is_claimed).reduce((sum, e) => sum + parseFloat(e.earning_amount), 0) || 0;
  const claimed = earnings?.filter(e => e.is_claimed).reduce((sum, e) => sum + parseFloat(e.earning_amount), 0) || 0;

  return NextResponse.json({
    earnings: earnings || [],
    summary: {
      pending: pending.toString(),
      claimed: claimed.toString(),
      total: (pending + claimed).toString()
    }
  });
}
