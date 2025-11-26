import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET - Get like count and check if user liked a token
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenAddress = searchParams.get('token');
  const userAddress = searchParams.get('user');

  if (!tokenAddress) {
    return NextResponse.json({ error: 'Token address required' }, { status: 400 });
  }

  const supabase = createServerClient();

  try {
    // Get total like count for token
    const { count: likeCount, error: countError } = await supabase
      .from('token_likes')
      .select('*', { count: 'exact', head: true })
      .eq('token_address', tokenAddress.toLowerCase());

    if (countError) {
      console.error('Error fetching like count:', countError);
      return NextResponse.json({ error: 'Failed to fetch likes' }, { status: 500 });
    }

    // Check if specific user liked the token
    let userLiked = false;
    if (userAddress) {
      const { data: userLikeData } = await supabase
        .from('token_likes')
        .select('id')
        .eq('token_address', tokenAddress.toLowerCase())
        .eq('user_address', userAddress.toLowerCase())
        .single();

      userLiked = !!userLikeData;
    }

    return NextResponse.json({
      likeCount: likeCount || 0,
      userLiked,
    });
  } catch (error) {
    console.error('Error in GET /api/likes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Like a token
export async function POST(request: NextRequest) {
  try {
    const { tokenAddress, userAddress } = await request.json();

    if (!tokenAddress || !userAddress) {
      return NextResponse.json(
        { error: 'Token address and user address required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Insert like (will fail if already exists due to UNIQUE constraint)
    const { data, error } = await supabase
      .from('token_likes')
      .insert({
        token_address: tokenAddress.toLowerCase(),
        user_address: userAddress.toLowerCase(),
      })
      .select()
      .single();

    if (error) {
      // Check if it's a duplicate (user already liked)
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Already liked', userLiked: true },
          { status: 409 }
        );
      }
      console.error('Error inserting like:', error);
      return NextResponse.json({ error: 'Failed to like token' }, { status: 500 });
    }

    // Get updated like count
    const { count: likeCount } = await supabase
      .from('token_likes')
      .select('*', { count: 'exact', head: true })
      .eq('token_address', tokenAddress.toLowerCase());

    return NextResponse.json({
      success: true,
      likeCount: likeCount || 0,
      userLiked: true,
    });
  } catch (error) {
    console.error('Error in POST /api/likes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Unlike a token
export async function DELETE(request: NextRequest) {
  try {
    const { tokenAddress, userAddress } = await request.json();

    if (!tokenAddress || !userAddress) {
      return NextResponse.json(
        { error: 'Token address and user address required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Delete the like
    const { error } = await supabase
      .from('token_likes')
      .delete()
      .eq('token_address', tokenAddress.toLowerCase())
      .eq('user_address', userAddress.toLowerCase());

    if (error) {
      console.error('Error deleting like:', error);
      return NextResponse.json({ error: 'Failed to unlike token' }, { status: 500 });
    }

    // Get updated like count
    const { count: likeCount } = await supabase
      .from('token_likes')
      .select('*', { count: 'exact', head: true })
      .eq('token_address', tokenAddress.toLowerCase());

    return NextResponse.json({
      success: true,
      likeCount: likeCount || 0,
      userLiked: false,
    });
  } catch (error) {
    console.error('Error in DELETE /api/likes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
