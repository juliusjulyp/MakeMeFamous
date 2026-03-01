import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET - List comments for a post
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get('post');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');

  if (!postId) {
    return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
  }

  const supabase = createServerClient();

  try {
    const { data, error } = await supabase.rpc('get_post_comments', {
      p_post_id: postId,
      p_limit: limit,
      p_offset: offset,
    });

    if (error) {
      console.error('Comments RPC error:', error);
      return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Comments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a comment
export async function POST(request: NextRequest) {
  try {
    const { postId, authorAddress, content } = await request.json();

    if (!postId || !authorAddress || !content) {
      return NextResponse.json({ error: 'Post ID, author address, and content required' }, { status: 400 });
    }

    if (content.length > 500) {
      return NextResponse.json({ error: 'Comment must be 500 characters or less' }, { status: 400 });
    }

    const supabase = createServerClient();

    const { data: comment, error } = await supabase
      .from('post_comments')
      .insert({
        post_id: postId,
        author_address: authorAddress.toLowerCase(),
        content,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating comment:', error);
      return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
    }

    // Get author info
    const { data: author } = await supabase
      .from('users')
      .select('username, avatar_url')
      .eq('address', authorAddress.toLowerCase())
      .single();

    return NextResponse.json({
      comment: {
        ...comment,
        authorUsername: author?.username || null,
        authorAvatar: author?.avatar_url || null,
      },
    });
  } catch (error) {
    console.error('Comment creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Soft-delete a comment
export async function DELETE(request: NextRequest) {
  try {
    const { commentId, authorAddress } = await request.json();

    if (!commentId || !authorAddress) {
      return NextResponse.json({ error: 'Comment ID and author address required' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Verify ownership
    const { data: comment } = await supabase
      .from('post_comments')
      .select('author_address')
      .eq('id', commentId)
      .single();

    if (!comment || comment.author_address !== authorAddress.toLowerCase()) {
      return NextResponse.json({ error: 'Not authorized to delete this comment' }, { status: 403 });
    }

    const { error } = await supabase
      .from('post_comments')
      .update({ is_deleted: true })
      .eq('id', commentId);

    if (error) {
      console.error('Error deleting comment:', error);
      return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Comment deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
