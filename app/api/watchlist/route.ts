import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET - Get user's watchlisted tokens
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userAddress = searchParams.get('user');

  if (!userAddress) {
    return NextResponse.json({ error: 'User address required' }, { status: 400 });
  }

  const supabase = createServerClient();

  try {
    const { data, error } = await supabase
      .from('watchlists')
      .select('token_address, created_at')
      .eq('user_address', userAddress.toLowerCase())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching watchlist:', error);
      return NextResponse.json({ error: 'Failed to fetch watchlist' }, { status: 500 });
    }

    return NextResponse.json({
      watchlist: data || [],
      count: data?.length || 0,
    });
  } catch (error) {
    console.error('Error in GET /api/watchlist:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Add token to watchlist
export async function POST(request: NextRequest) {
  try {
    const { userAddress, tokenAddress } = await request.json();

    if (!userAddress || !tokenAddress) {
      return NextResponse.json(
        { error: 'User address and token address required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { error } = await supabase
      .from('watchlists')
      .insert({
        user_address: userAddress.toLowerCase(),
        token_address: tokenAddress.toLowerCase(),
      });

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Already watchlisted' }, { status: 409 });
      }
      console.error('Error adding to watchlist:', error);
      return NextResponse.json({ error: 'Failed to add to watchlist' }, { status: 500 });
    }

    return NextResponse.json({ success: true, isWatchlisted: true });
  } catch (error) {
    console.error('Error in POST /api/watchlist:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove token from watchlist
export async function DELETE(request: NextRequest) {
  try {
    const { userAddress, tokenAddress } = await request.json();

    if (!userAddress || !tokenAddress) {
      return NextResponse.json(
        { error: 'User address and token address required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { error } = await supabase
      .from('watchlists')
      .delete()
      .eq('user_address', userAddress.toLowerCase())
      .eq('token_address', tokenAddress.toLowerCase());

    if (error) {
      console.error('Error removing from watchlist:', error);
      return NextResponse.json({ error: 'Failed to remove from watchlist' }, { status: 500 });
    }

    return NextResponse.json({ success: true, isWatchlisted: false });
  } catch (error) {
    console.error('Error in DELETE /api/watchlist:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
