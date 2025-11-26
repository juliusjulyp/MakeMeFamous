import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// Generate a random nonce for wallet signature
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: 'Address required' }, { status: 400 });
  }

  const supabase = createServerClient();

  // Generate random nonce
  const nonce = `Sign this message to authenticate with MakeMeFamous:\n\nNonce: ${crypto.randomUUID()}\nTimestamp: ${Date.now()}`;

  // Delete any existing unused nonces for this address
  await supabase
    .from('auth_nonces')
    .delete()
    .eq('address', address.toLowerCase())
    .eq('used', false);

  // Store nonce in database (expires in 5 minutes)
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from('auth_nonces')
    .insert({
      address: address.toLowerCase(),
      nonce,
      expires_at: expiresAt,
    });

  if (error) {
    console.error('Error storing nonce:', error);
    return NextResponse.json({ error: 'Failed to generate nonce' }, { status: 500 });
  }

  return NextResponse.json({ nonce });
}
