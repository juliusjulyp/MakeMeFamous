import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET user by address (query param)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: 'Address required' }, { status: 400 });
  }

  const supabase = createServerClient();

  // Get user with stats
  const { data: user, error } = await supabase
    .from('users')
    .select(`
      *,
      user_stats (*)
    `)
    .eq('address', address.toLowerCase())
    .single();

  if (error || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ user });
}

// PUT update user profile (creates user if doesn't exist)
export async function PUT(request: NextRequest) {
  try {
    const { address, username, bio, avatar_url, twitter_handle, telegram_handle, website } = await request.json();

    if (!address) {
      return NextResponse.json({ error: 'Address required' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('address', address.toLowerCase())
      .single();

    let user;

    if (existingUser) {
      // Update existing user
      const { data: updatedUser, error } = await supabase
        .from('users')
        .update({
          username: username || null,
          bio: bio || null,
          avatar_url: avatar_url || null,
          twitter_handle: twitter_handle || null,
          telegram_handle: telegram_handle || null,
          website: website || null,
        })
        .eq('address', address.toLowerCase())
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
        }
        console.error('Error updating user:', error);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
      }
      user = updatedUser;
    } else {
      // Create new user
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          address: address.toLowerCase(),
          username: username || null,
          bio: bio || null,
          avatar_url: avatar_url || null,
          twitter_handle: twitter_handle || null,
          telegram_handle: telegram_handle || null,
          website: website || null,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
        }
        console.error('Error creating user:', error);
        return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
      }

      // Create user stats
      await supabase
        .from('user_stats')
        .insert({ user_id: newUser.id });

      user = newUser;
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
