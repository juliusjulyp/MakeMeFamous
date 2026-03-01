import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET - Get user's price alerts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userAddress = searchParams.get('user');

  if (!userAddress) {
    return NextResponse.json({ error: 'User address required' }, { status: 400 });
  }

  const supabase = createServerClient();

  try {
    const { data: alerts, error } = await supabase
      .from('price_alerts')
      .select('*')
      .eq('user_address', userAddress.toLowerCase())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching alerts:', error);
      return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
    }

    // Get token metadata for alerts
    const tokenAddresses = [...new Set((alerts || []).map((a: any) => a.token_address))];
    let tokenMap: Record<string, any> = {};

    if (tokenAddresses.length > 0) {
      const { data: tokens } = await supabase
        .from('token_metadata')
        .select('token_address, name, symbol, image_url')
        .in('token_address', tokenAddresses);

      tokenMap = Object.fromEntries(
        (tokens || []).map((t: any) => [t.token_address, t])
      );
    }

    const enrichedAlerts = (alerts || []).map((alert: any) => ({
      ...alert,
      tokenName: tokenMap[alert.token_address]?.name || 'Unknown',
      tokenSymbol: tokenMap[alert.token_address]?.symbol || '???',
      tokenImage: tokenMap[alert.token_address]?.image_url || null,
    }));

    return NextResponse.json({ alerts: enrichedAlerts });
  } catch (error) {
    console.error('Error in GET /api/alerts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a price alert
export async function POST(request: NextRequest) {
  try {
    const { userAddress, tokenAddress, targetPrice, direction } = await request.json();

    if (!userAddress || !tokenAddress || !targetPrice || !direction) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['above', 'below'].includes(direction)) {
      return NextResponse.json({ error: 'Direction must be "above" or "below"' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Limit to 10 active alerts per user
    const { count } = await supabase
      .from('price_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('user_address', userAddress.toLowerCase())
      .eq('is_active', true);

    if ((count || 0) >= 10) {
      return NextResponse.json({ error: 'Maximum 10 active alerts allowed' }, { status: 400 });
    }

    const { data: alert, error } = await supabase
      .from('price_alerts')
      .insert({
        user_address: userAddress.toLowerCase(),
        token_address: tokenAddress.toLowerCase(),
        target_price: targetPrice,
        direction,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating alert:', error);
      return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 });
    }

    return NextResponse.json({ alert });
  } catch (error) {
    console.error('Error in POST /api/alerts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Toggle alert active/inactive
export async function PUT(request: NextRequest) {
  try {
    const { id, is_active } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Alert ID required' }, { status: 400 });
    }

    const supabase = createServerClient();

    const { data: alert, error } = await supabase
      .from('price_alerts')
      .update({ is_active })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating alert:', error);
      return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 });
    }

    return NextResponse.json({ alert });
  } catch (error) {
    console.error('Error in PUT /api/alerts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a price alert
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Alert ID required' }, { status: 400 });
    }

    const supabase = createServerClient();

    const { error } = await supabase
      .from('price_alerts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting alert:', error);
      return NextResponse.json({ error: 'Failed to delete alert' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/alerts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
