import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET - Get follows data
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userAddress = searchParams.get('user');
  const type = searchParams.get('type') || 'following'; // 'following' or 'followers'
  const creatorAddress = searchParams.get('creator'); // Check specific follow

  if (!userAddress) {
    return NextResponse.json({ error: 'User address required' }, { status: 400 });
  }

  const supabase = createServerClient();

  try {
    // Check if user follows a specific creator
    if (creatorAddress) {
      const { data } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_address', userAddress.toLowerCase())
        .eq('followed_address', creatorAddress.toLowerCase())
        .single();

      return NextResponse.json({ isFollowing: !!data });
    }

    if (type === 'following') {
      const { data, error } = await supabase
        .from('follows')
        .select('followed_address, created_at')
        .eq('follower_address', userAddress.toLowerCase())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching following:', error);
        return NextResponse.json({ error: 'Failed to fetch following' }, { status: 500 });
      }

      return NextResponse.json({
        following: data?.map((f: any) => f.followed_address) || [],
        count: data?.length || 0,
      });
    } else {
      const { data, error } = await supabase
        .from('follows')
        .select('follower_address, created_at')
        .eq('followed_address', userAddress.toLowerCase())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching followers:', error);
        return NextResponse.json({ error: 'Failed to fetch followers' }, { status: 500 });
      }

      return NextResponse.json({
        followers: data?.map((f: any) => f.follower_address) || [],
        count: data?.length || 0,
      });
    }
  } catch (error) {
    console.error('Error in GET /api/follows:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Follow a creator
export async function POST(request: NextRequest) {
  try {
    const { followerAddress, followedAddress } = await request.json();

    if (!followerAddress || !followedAddress) {
      return NextResponse.json(
        { error: 'Follower and followed addresses required' },
        { status: 400 }
      );
    }

    if (followerAddress.toLowerCase() === followedAddress.toLowerCase()) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    const supabase = createServerClient();

    const { error } = await supabase
      .from('follows')
      .insert({
        follower_address: followerAddress.toLowerCase(),
        followed_address: followedAddress.toLowerCase(),
      });

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Already following' }, { status: 409 });
      }
      console.error('Error following:', error);
      return NextResponse.json({ error: 'Failed to follow' }, { status: 500 });
    }

    // Get updated follower count
    const { count } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('followed_address', followedAddress.toLowerCase());

    return NextResponse.json({ success: true, isFollowing: true, followerCount: count || 0 });
  } catch (error) {
    console.error('Error in POST /api/follows:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Unfollow a creator
export async function DELETE(request: NextRequest) {
  try {
    const { followerAddress, followedAddress } = await request.json();

    if (!followerAddress || !followedAddress) {
      return NextResponse.json(
        { error: 'Follower and followed addresses required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_address', followerAddress.toLowerCase())
      .eq('followed_address', followedAddress.toLowerCase());

    if (error) {
      console.error('Error unfollowing:', error);
      return NextResponse.json({ error: 'Failed to unfollow' }, { status: 500 });
    }

    // Get updated follower count
    const { count } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('followed_address', followedAddress.toLowerCase());

    return NextResponse.json({ success: true, isFollowing: false, followerCount: count || 0 });
  } catch (error) {
    console.error('Error in DELETE /api/follows:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
