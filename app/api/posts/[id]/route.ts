import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET - Single post with author info
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const userAddress = searchParams.get('user');

  const supabase = createServerClient();

  try {
    const { data: post, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false)
      .single();

    if (error || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Get author info
    const { data: author } = await supabase
      .from('users')
      .select('username, avatar_url')
      .eq('address', post.author_address)
      .single();

    // Check user interactions
    let userLiked = false;
    let userReposted = false;

    if (userAddress) {
      const normalizedUser = userAddress.toLowerCase();

      const { data: likeData } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', id)
        .eq('user_address', normalizedUser)
        .single();
      userLiked = !!likeData;

      const { data: repostData } = await supabase
        .from('reposts')
        .select('id')
        .eq('post_id', id)
        .eq('user_address', normalizedUser)
        .single();
      userReposted = !!repostData;
    }

    // Get original post if this is a repost
    let originalPost = null;
    if (post.repost_of) {
      const { data: original } = await supabase
        .from('posts')
        .select('*')
        .eq('id', post.repost_of)
        .single();

      if (original) {
        const { data: origAuthor } = await supabase
          .from('users')
          .select('username, avatar_url')
          .eq('address', original.author_address)
          .single();

        originalPost = {
          ...original,
          authorUsername: origAuthor?.username || null,
          authorAvatar: origAuthor?.avatar_url || null,
        };
      }
    }

    return NextResponse.json({
      post: {
        ...post,
        authorUsername: author?.username || null,
        authorAvatar: author?.avatar_url || null,
        userLiked,
        userReposted,
        originalPost,
      },
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
