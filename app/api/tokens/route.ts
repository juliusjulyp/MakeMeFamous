import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET token metadata
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  const supabase = createServerClient();

  if (address) {
    // Get single token
    const { data: token, error } = await supabase
      .from('token_metadata')
      .select('*')
      .eq('token_address', address.toLowerCase())
      .single();

    if (error || !token) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    return NextResponse.json({ token });
  } else {
    // Get all tokens
    const { data: tokens, error } = await supabase
      .from('token_metadata')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch tokens' }, { status: 500 });
    }

    return NextResponse.json({ tokens });
  }
}

// POST create token metadata
export async function POST(request: NextRequest) {
  try {
    const {
      token_address,
      creator_address,
      name,
      symbol,
      description,
      image_url,
      website,
      twitter,
      telegram
    } = await request.json();

    if (!token_address || !creator_address || !name || !symbol || !image_url) {
      return NextResponse.json({ error: 'Missing required fields (token_address, creator_address, name, symbol, image_url)' }, { status: 400 });
    }

    const supabase = createServerClient();

    const { data: token, error } = await supabase
      .from('token_metadata')
      .insert({
        token_address: token_address.toLowerCase(),
        creator_address: creator_address.toLowerCase(),
        name,
        symbol,
        description: description || null,
        image_url,
        website: website || null,
        twitter: twitter || null,
        telegram: telegram || null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Token already exists' }, { status: 409 });
      }
      console.error('Error creating token:', error);
      return NextResponse.json({ error: 'Failed to create token' }, { status: 500 });
    }

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Token creation error:', error);
    return NextResponse.json({ error: 'Failed to create token' }, { status: 500 });
  }
}

// PUT update token metadata
export async function PUT(request: NextRequest) {
  try {
    const {
      token_address,
      description,
      image_url,
      website,
      twitter,
      telegram
    } = await request.json();

    if (!token_address) {
      return NextResponse.json({ error: 'Token address required' }, { status: 400 });
    }

    const supabase = createServerClient();

    const { data: token, error } = await supabase
      .from('token_metadata')
      .update({
        description,
        image_url,
        website,
        twitter,
        telegram,
      })
      .eq('token_address', token_address.toLowerCase())
      .select()
      .single();

    if (error) {
      console.error('Error updating token:', error);
      return NextResponse.json({ error: 'Failed to update token' }, { status: 500 });
    }

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Token update error:', error);
    return NextResponse.json({ error: 'Failed to update token' }, { status: 500 });
  }
}
