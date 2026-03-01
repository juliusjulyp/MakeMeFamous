import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// POST - Like a post
export async function POST(request: NextRequest) {
  try {
    const { postId, userAddress } = await request.json();

    if (!postId || !userAddress) {
      return NextResponse.json({ error: 'Post ID and user address required' }, { status: 400 });
    }

    const supabase = createServerClient();

    const { error } = await supabase
      .from('post_likes')
      .insert({
        post_id: postId,
        user_address: userAddress.toLowerCase(),
      });

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Already liked' }, { status: 409 });
      }
      console.error('Error liking post:', error);
      return NextResponse.json({ error: 'Failed to like post' }, { status: 500 });
    }

    // Get updated count
    const { data: post } = await supabase
      .from('posts')
      .select('like_count')
      .eq('id', postId)
      .single();

    return NextResponse.json({
      success: true,
      likeCount: post?.like_count || 0,
      userLiked: true,
    });
  } catch (error) {
    console.error('Error in POST /api/posts/likes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Unlike a post
export async function DELETE(request: NextRequest) {
  try {
    const { postId, userAddress } = await request.json();

    if (!postId || !userAddress) {
      return NextResponse.json({ error: 'Post ID and user address required' }, { status: 400 });
    }

    const supabase = createServerClient();

    const { error } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_address', userAddress.toLowerCase());

    if (error) {
      console.error('Error unliking post:', error);
      return NextResponse.json({ error: 'Failed to unlike post' }, { status: 500 });
    }

    // Get updated count
    const { data: post } = await supabase
      .from('posts')
      .select('like_count')
      .eq('id', postId)
      .single();

    return NextResponse.json({
      success: true,
      likeCount: post?.like_count || 0,
      userLiked: false,
    });
  } catch (error) {
    console.error('Error in DELETE /api/posts/likes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
