import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET - Search tokens for tagging in posts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || query.length < 1) {
    return NextResponse.json({ tokens: [] });
  }

  const supabase = createServerClient();

  try {
    const { data: tokens, error } = await supabase
      .from('token_metadata')
      .select('token_address, name, symbol, image_url')
      .or(`name.ilike.%${query}%,symbol.ilike.%${query}%`)
      .limit(10);

    if (error) {
      console.error('Token search error:', error);
      return NextResponse.json({ error: 'Failed to search tokens' }, { status: 500 });
    }

    return NextResponse.json({ tokens: tokens || [] });
  } catch (error) {
    console.error('Token search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
