import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// POST - Repost
export async function POST(request: NextRequest) {
  try {
    const { postId, userAddress } = await request.json();

    if (!postId || !userAddress) {
      return NextResponse.json({ error: 'Post ID and user address required' }, { status: 400 });
    }

    const supabase = createServerClient();
    const normalizedUser = userAddress.toLowerCase();

    // Insert into reposts tracking table (trigger updates count)
    const { error: repostError } = await supabase
      .from('reposts')
      .insert({
        post_id: postId,
        user_address: normalizedUser,
      });

    if (repostError) {
      if (repostError.code === '23505') {
        return NextResponse.json({ error: 'Already reposted' }, { status: 409 });
      }
      console.error('Error creating repost:', repostError);
      return NextResponse.json({ error: 'Failed to repost' }, { status: 500 });
    }

    // Create a repost entry in posts table (appears in feed)
    const { error: postError } = await supabase
      .from('posts')
      .insert({
        author_address: normalizedUser,
        content: '',
        repost_of: postId,
      });

    if (postError) {
      console.error('Error creating repost post:', postError);
      // Rollback the repost tracking entry
      await supabase
        .from('reposts')
        .delete()
        .eq('post_id', postId)
        .eq('user_address', normalizedUser);
      return NextResponse.json({ error: 'Failed to repost' }, { status: 500 });
    }

    // Get updated count
    const { data: post } = await supabase
      .from('posts')
      .select('repost_count')
      .eq('id', postId)
      .single();

    return NextResponse.json({
      success: true,
      repostCount: post?.repost_count || 0,
      userReposted: true,
    });
  } catch (error) {
    console.error('Repost error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Un-repost
export async function DELETE(request: NextRequest) {
  try {
    const { postId, userAddress } = await request.json();

    if (!postId || !userAddress) {
      return NextResponse.json({ error: 'Post ID and user address required' }, { status: 400 });
    }

    const supabase = createServerClient();
    const normalizedUser = userAddress.toLowerCase();

    // Remove from reposts tracking (trigger decrements count)
    const { error: repostError } = await supabase
      .from('reposts')
      .delete()
      .eq('post_id', postId)
      .eq('user_address', normalizedUser);

    if (repostError) {
      console.error('Error removing repost:', repostError);
      return NextResponse.json({ error: 'Failed to un-repost' }, { status: 500 });
    }

    // Remove the repost post entry
    await supabase
      .from('posts')
      .delete()
      .eq('repost_of', postId)
      .eq('author_address', normalizedUser);

    // Get updated count
    const { data: post } = await supabase
      .from('posts')
      .select('repost_count')
      .eq('id', postId)
      .single();

    return NextResponse.json({
      success: true,
      repostCount: post?.repost_count || 0,
      userReposted: false,
    });
  } catch (error) {
    console.error('Un-repost error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
