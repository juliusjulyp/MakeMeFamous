import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET referral stats for a user
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');
  const code = searchParams.get('code');

  const supabase = createServerClient();

  // If code provided, get referrer address
  if (code) {
    const { data } = await supabase
      .from('referral_codes')
      .select('address')
      .eq('code', code.toUpperCase())
      .single();

    if (!data) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 });
    }
    return NextResponse.json({ referrer: data.address });
  }

  if (!address) {
    return NextResponse.json({ error: 'Address required' }, { status: 400 });
  }

  const normalizedAddress = address.toLowerCase();

  // Get or create referral code
  let { data: codeData } = await supabase
    .from('referral_codes')
    .select('*')
    .eq('address', normalizedAddress)
    .single();

  if (!codeData) {
    const code = normalizedAddress.slice(2, 8).toUpperCase();
    const { data: newCode } = await supabase
      .from('referral_codes')
      .insert({ address: normalizedAddress, code })
      .select()
      .single();
    codeData = newCode;
  }

  // Get referral stats
  const { data: stats } = await supabase
    .from('referral_stats')
    .select('*')
    .eq('referrer_address', normalizedAddress)
    .single();

  // Get referrals list
  const { data: referrals } = await supabase
    .from('referrals')
    .select('referred_address, created_at, total_volume')
    .eq('referrer_address', normalizedAddress)
    .order('created_at', { ascending: false })
    .limit(50);

  return NextResponse.json({
    code: codeData?.code || normalizedAddress.slice(2, 8).toUpperCase(),
    stats: stats || { total_referrals: 0, total_volume: '0', total_earnings: '0', pending_earnings: '0' },
    referrals: referrals || []
  });
}

// POST - Register a referral
export async function POST(request: NextRequest) {
  try {
    const { referrerCode, referredAddress } = await request.json();

    if (!referrerCode || !referredAddress) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const supabase = createServerClient();
    const normalizedReferred = referredAddress.toLowerCase();

    // Get referrer from code
    const { data: codeData } = await supabase
      .from('referral_codes')
      .select('address')
      .eq('code', referrerCode.toUpperCase())
      .single();

    if (!codeData) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 });
    }

    if (codeData.address === normalizedReferred) {
      return NextResponse.json({ error: 'Cannot refer yourself' }, { status: 400 });
    }

    // Check if already referred
    const { data: existing } = await supabase
      .from('referrals')
      .select('id')
      .eq('referred_address', normalizedReferred)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Already referred' }, { status: 409 });
    }

    // Create referral
    const { error } = await supabase
      .from('referrals')
      .insert({
        referrer_address: codeData.address,
        referred_address: normalizedReferred,
        referral_code: referrerCode.toUpperCase()
      });

    if (error) {
      return NextResponse.json({ error: 'Failed to create referral' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
