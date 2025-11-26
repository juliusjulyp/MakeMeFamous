import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { verifyMessage } from 'viem';

export async function POST(request: NextRequest) {
  try {
    const { address, message, signature } = await request.json();

    if (!address || !message || !signature) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Verify nonce exists and is valid
    const { data: nonceRecord, error: nonceError } = await supabase
      .from('auth_nonces')
      .select('*')
      .eq('address', address.toLowerCase())
      .eq('nonce', message)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (nonceError || !nonceRecord) {
      return NextResponse.json({ error: 'Invalid or expired nonce' }, { status: 401 });
    }

    // Verify the signature
    const isValid = await verifyMessage({
      address: address as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Mark nonce as used
    await supabase
      .from('auth_nonces')
      .update({ used: true })
      .eq('id', nonceRecord.id);

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('address', address.toLowerCase())
      .single();

    let user;

    if (existingUser) {
      user = existingUser;
    } else {
      // Create new user
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({ address: address.toLowerCase() })
        .select()
        .single();

      if (error) {
        console.error('Error creating user:', error);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
      }

      // Create user stats
      await supabase
        .from('user_stats')
        .insert({ user_id: newUser.id });

      user = newUser;
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        address: user.address,
        username: user.username,
        bio: user.bio,
        avatar_url: user.avatar_url,
        twitter_handle: user.twitter_handle,
        telegram_handle: user.telegram_handle,
        website: user.website,
      }
    });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
