import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// PUT update user stats
export async function PUT(request: NextRequest) {
  try {
    const { address, field, increment = 1 } = await request.json();

    if (!address || !field) {
      return NextResponse.json({ error: 'Address and field required' }, { status: 400 });
    }

    const allowedFields = ['tokens_created', 'tokens_held', 'total_trades', 'chat_messages'];
    if (!allowedFields.includes(field)) {
      return NextResponse.json({ error: 'Invalid field' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Get user id
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('address', address.toLowerCase())
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get current stats
    const { data: stats } = await supabase
      .from('user_stats')
      .select(field)
      .eq('user_id', user.id)
      .single();

    // Update stat
    const currentValue = stats && typeof stats === 'object' && field in stats
      ? (stats[field as keyof typeof stats] as number) || 0
      : 0;
    const { data: updatedStats, error } = await supabase
      .from('user_stats')
      .update({ [field]: currentValue + increment })
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating stats:', error);
      return NextResponse.json({ error: 'Failed to update stats' }, { status: 500 });
    }

    return NextResponse.json({ stats: updatedStats });
  } catch (error) {
    console.error('Stats update error:', error);
    return NextResponse.json({ error: 'Failed to update stats' }, { status: 500 });
  }
}
