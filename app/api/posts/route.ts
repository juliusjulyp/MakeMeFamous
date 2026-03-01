import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET - Social feed
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const feedType = searchParams.get('feed') || 'global';
  const userAddress = searchParams.get('user') || null;
  const targetAddress = searchParams.get('target') || null;
  const following = searchParams.get('following');
  const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'));
  const before = searchParams.get('before') || null;

  const followingArray = following
    ? following.split(',').map(a => a.toLowerCase())
    : null;

  const supabase = createServerClient();

  try {
    const { data, error } = await supabase.rpc('get_social_feed', {
      p_feed_type: feedType,
      p_user_address: userAddress?.toLowerCase() || null,
      p_target_address: targetAddress?.toLowerCase() || null,
      p_following: followingArray,
      p_limit: limit,
      p_before: before,
    });

    if (error) {
      console.error('Social feed RPC error:', error);
      return NextResponse.json({ error: 'Failed to fetch feed' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Social feed error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a post
export async function POST(request: NextRequest) {
  try {
    const {
      authorAddress,
      content,
      images,
      tokenTags,
      linkUrl,
      linkTitle,
      linkDescription,
      linkImage,
    } = await request.json();

    if (!authorAddress || !content) {
      return NextResponse.json({ error: 'Author address and content required' }, { status: 400 });
    }

    if (content.length > 1000) {
      return NextResponse.json({ error: 'Content must be 1000 characters or less' }, { status: 400 });
    }

    if (images && images.length > 4) {
      return NextResponse.json({ error: 'Maximum 4 images allowed' }, { status: 400 });
    }

    const supabase = createServerClient();

    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        author_address: authorAddress.toLowerCase(),
        content,
        images: images || [],
        token_tags: (tokenTags || []).map((t: string) => t.toLowerCase()),
        link_url: linkUrl || null,
        link_title: linkTitle || null,
        link_description: linkDescription || null,
        link_image: linkImage || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating post:', error);
      return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
    }

    // Get author info
    const { data: author } = await supabase
      .from('users')
      .select('username, avatar_url')
      .eq('address', authorAddress.toLowerCase())
      .single();

    return NextResponse.json({
      post: {
        id: post.id,
        authorAddress: post.author_address,
        content: post.content,
        images: post.images || [],
        tokenTags: post.token_tags || [],
        linkUrl: post.link_url || null,
        linkTitle: post.link_title || null,
        linkDescription: post.link_description || null,
        linkImage: post.link_image || null,
        repostOf: post.repost_of || null,
        likeCount: 0,
        commentCount: 0,
        repostCount: 0,
        createdAt: post.created_at,
        authorUsername: author?.username || null,
        authorAvatar: author?.avatar_url || null,
        userLiked: false,
        userReposted: false,
        originalPost: null,
      },
    });
  } catch (error) {
    console.error('Post creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Soft-delete a post
export async function DELETE(request: NextRequest) {
  try {
    const { postId, authorAddress } = await request.json();

    if (!postId || !authorAddress) {
      return NextResponse.json({ error: 'Post ID and author address required' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Verify ownership
    const { data: post } = await supabase
      .from('posts')
      .select('author_address')
      .eq('id', postId)
      .single();

    if (!post || post.author_address !== authorAddress.toLowerCase()) {
      return NextResponse.json({ error: 'Not authorized to delete this post' }, { status: 403 });
    }

    const { error } = await supabase
      .from('posts')
      .update({ is_deleted: true })
      .eq('id', postId);

    if (error) {
      console.error('Error deleting post:', error);
      return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Post deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
