import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// POST - Claim pending referral earnings
export async function POST(request: NextRequest) {
  try {
    const { address, signature, message } = await request.json();

    if (!address) {
      return NextResponse.json({ error: 'Address required' }, { status: 400 });
    }

    const supabase = createServerClient();
    const normalizedAddress = address.toLowerCase();

    // Get current stats
    const { data: stats, error: statsError } = await supabase
      .from('referral_stats')
      .select('*')
      .eq('referrer_address', normalizedAddress)
      .single();

    if (statsError || !stats) {
      return NextResponse.json({ error: 'No earnings found' }, { status: 404 });
    }

    const pendingAmount = parseFloat(stats.pending_earnings || '0');

    if (pendingAmount <= 0) {
      return NextResponse.json({ error: 'No pending earnings to claim' }, { status: 400 });
    }

    // For now, we'll just mark earnings as claimed in the database
    // In production, this would trigger a smart contract call to transfer MATIC

    // Update stats: move pending to claimed
    const { error: updateError } = await supabase
      .from('referral_stats')
      .update({
        pending_earnings: '0',
        claimed_earnings: (parseFloat(stats.claimed_earnings || '0') + pendingAmount).toString(),
        updated_at: new Date().toISOString()
      })
      .eq('referrer_address', normalizedAddress);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to process claim' }, { status: 500 });
    }

    // Mark all pending earnings as claimed
    await supabase
      .from('referral_earnings')
      .update({ is_claimed: true })
      .eq('referrer_address', normalizedAddress)
      .eq('is_claimed', false);

    // Create claim record for history
    await supabase
      .from('referral_claims')
      .insert({
        address: normalizedAddress,
        amount: pendingAmount.toString(),
        status: 'pending', // Would be 'completed' after on-chain confirmation
        created_at: new Date().toISOString()
      });

    return NextResponse.json({
      success: true,
      claimedAmount: pendingAmount.toString(),
      message: `Successfully claimed ${pendingAmount.toFixed(4)} MATIC. Funds will be transferred shortly.`
    });
  } catch (error) {
    console.error('Claim error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// GET - Get claim history
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: 'Address required' }, { status: 400 });
  }

  const supabase = createServerClient();
  const normalizedAddress = address.toLowerCase();

  const { data: claims } = await supabase
    .from('referral_claims')
    .select('*')
    .eq('address', normalizedAddress)
    .order('created_at', { ascending: false })
    .limit(50);

  return NextResponse.json({ claims: claims || [] });
}
