-- Postgres Functions for MakeMeFamous
-- Replaces in-memory JS aggregation with server-side SQL
-- Run this in Supabase SQL Editor after wave6-migration.sql

-- ============================================================
-- 1. discover_tokens
-- Token discovery with filtering, sorting, pagination
-- Replaces: app/api/tokens/discover/route.ts
-- ============================================================

CREATE OR REPLACE FUNCTION discover_tokens(
  p_category TEXT DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'trending',
  p_min_volume NUMERIC DEFAULT 0,
  p_min_holders INT DEFAULT 0,
  p_max_age_days INT DEFAULT 0,
  p_page INT DEFAULT 1,
  p_limit INT DEFAULT 20,
  p_user_address TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_offset INT;
  v_total_count INT;
  v_total_pages INT;
  v_cutoff TIMESTAMPTZ;
  v_result JSON;
BEGIN
  v_offset := (p_page - 1) * p_limit;
  v_cutoff := CASE WHEN p_max_age_days > 0
    THEN NOW() - (p_max_age_days || ' days')::INTERVAL
    ELSE NULL
  END;

  -- Build the enriched token list with stats
  WITH token_stats AS (
    SELECT
      tm.token_address,
      tm.name,
      tm.symbol,
      tm.image_url,
      COALESCE(tm.category, 'meme') AS category,
      tm.creator_address,
      tm.created_at,
      COALESCE(SUM(t.volume::NUMERIC), 0) AS total_volume,
      COALESCE(SUM(CASE WHEN t.created_at > NOW() - INTERVAL '24 hours' THEN t.volume::NUMERIC ELSE 0 END), 0) AS volume_24h,
      COALESCE(SUM(CASE WHEN t.created_at > NOW() - INTERVAL '7 days' THEN t.volume::NUMERIC ELSE 0 END), 0) AS volume_7d,
      COUNT(t.id) AS trade_count,
      COUNT(DISTINCT t.trader_address) AS holder_count
    FROM token_metadata tm
    LEFT JOIN trades t ON t.token_address = tm.token_address
    WHERE
      (p_category IS NULL OR tm.category = p_category)
      AND (p_search IS NULL OR tm.name ILIKE '%' || p_search || '%' OR tm.symbol ILIKE '%' || p_search || '%')
      AND (v_cutoff IS NULL OR tm.created_at >= v_cutoff)
    GROUP BY tm.token_address, tm.name, tm.symbol, tm.image_url, tm.category, tm.creator_address, tm.created_at
  ),
  -- Price change calculation for 24h
  price_changes AS (
    SELECT
      ts.token_address,
      -- Get first and last trade prices in 24h window
      (SELECT t2.volume::NUMERIC / NULLIF(t2.token_amount::NUMERIC, 0)
       FROM trades t2
       WHERE t2.token_address = ts.token_address AND t2.created_at > NOW() - INTERVAL '24 hours'
       ORDER BY t2.created_at ASC LIMIT 1
      ) AS first_price_24h,
      (SELECT t2.volume::NUMERIC / NULLIF(t2.token_amount::NUMERIC, 0)
       FROM trades t2
       WHERE t2.token_address = ts.token_address AND t2.created_at > NOW() - INTERVAL '24 hours'
       ORDER BY t2.created_at DESC LIMIT 1
      ) AS last_price_24h
    FROM token_stats ts
    WHERE ts.volume_24h > 0
  ),
  -- Like counts per token
  like_counts AS (
    SELECT token_address, COUNT(*) AS like_count
    FROM token_likes
    WHERE token_address IN (SELECT token_address FROM token_stats)
    GROUP BY token_address
  ),
  -- User watchlist status
  user_watchlist AS (
    SELECT token_address
    FROM watchlists
    WHERE p_user_address IS NOT NULL AND user_address = p_user_address
  ),
  -- User like status
  user_likes AS (
    SELECT token_address
    FROM token_likes
    WHERE p_user_address IS NOT NULL AND user_address = p_user_address
  ),
  -- Enriched tokens with all computed fields
  enriched AS (
    SELECT
      ts.*,
      CASE WHEN pc.first_price_24h IS NOT NULL AND pc.first_price_24h > 0
        THEN ((pc.last_price_24h - pc.first_price_24h) / pc.first_price_24h) * 100
        ELSE NULL
      END AS price_change_24h,
      COALESCE(lc.like_count, 0) AS like_count,
      CASE WHEN uw.token_address IS NOT NULL THEN TRUE ELSE FALSE END AS is_watchlisted,
      CASE WHEN ul.token_address IS NOT NULL THEN TRUE ELSE FALSE END AS is_liked,
      -- Trending score: log(volume+1)*10 + trades*2 + holders*5 + log(volume24h+1)*30
      (LOG(ts.total_volume + 1) * 10 + ts.trade_count * 2 + ts.holder_count * 5 + LOG(ts.volume_24h + 1) * 30) AS trending_score
    FROM token_stats ts
    LEFT JOIN price_changes pc ON pc.token_address = ts.token_address
    LEFT JOIN like_counts lc ON lc.token_address = ts.token_address
    LEFT JOIN user_watchlist uw ON uw.token_address = ts.token_address
    LEFT JOIN user_likes ul ON ul.token_address = ts.token_address
    WHERE
      (p_min_volume <= 0 OR ts.total_volume >= p_min_volume)
      AND (p_min_holders <= 0 OR ts.holder_count >= p_min_holders)
  ),
  -- Count before pagination
  counted AS (
    SELECT COUNT(*) AS cnt FROM enriched
  ),
  -- Sorted and paginated
  sorted AS (
    SELECT e.*
    FROM enriched e
    ORDER BY
      CASE WHEN p_sort_by = 'trending' THEN e.trending_score END DESC NULLS LAST,
      CASE WHEN p_sort_by = 'volume24h' THEN e.volume_24h END DESC NULLS LAST,
      CASE WHEN p_sort_by = 'volume' THEN e.total_volume END DESC NULLS LAST,
      CASE WHEN p_sort_by = 'holders' THEN e.holder_count END DESC NULLS LAST,
      CASE WHEN p_sort_by = 'newest' THEN EXTRACT(EPOCH FROM e.created_at) END DESC NULLS LAST,
      CASE WHEN p_sort_by = 'likes' THEN e.like_count END DESC NULLS LAST,
      e.trending_score DESC NULLS LAST
    LIMIT p_limit OFFSET v_offset
  )
  SELECT json_build_object(
    'tokens', COALESCE((
      SELECT json_agg(json_build_object(
        'tokenAddress', s.token_address,
        'name', s.name,
        'symbol', s.symbol,
        'imageUrl', s.image_url,
        'category', s.category,
        'creatorAddress', s.creator_address,
        'createdAt', s.created_at,
        'totalVolume', s.total_volume,
        'volume24h', s.volume_24h,
        'volume7d', s.volume_7d,
        'tradeCount', s.trade_count,
        'holderCount', s.holder_count,
        'priceChange24h', s.price_change_24h,
        'trendingScore', s.trending_score,
        'likeCount', s.like_count,
        'isWatchlisted', s.is_watchlisted,
        'isLiked', s.is_liked
      ))
      FROM sorted s
    ), '[]'::JSON),
    'totalCount', (SELECT cnt FROM counted),
    'page', p_page,
    'totalPages', CEIL((SELECT cnt FROM counted)::NUMERIC / p_limit)
  ) INTO v_result;

  RETURN v_result;
END;
$$;


-- ============================================================
-- 2. get_token_leaderboard
-- Token leaderboard with platform stats
-- Replaces: getTokenLeaderboard() in app/api/leaderboard/route.ts
-- ============================================================

CREATE OR REPLACE FUNCTION get_token_leaderboard(
  p_sort_by TEXT DEFAULT 'volume',
  p_limit INT DEFAULT 20
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  WITH token_stats AS (
    SELECT
      tm.token_address,
      tm.name,
      tm.symbol,
      tm.image_url,
      tm.creator_address,
      COALESCE(SUM(t.volume::NUMERIC), 0) AS total_volume,
      COALESCE(SUM(CASE WHEN t.created_at > NOW() - INTERVAL '24 hours' THEN t.volume::NUMERIC ELSE 0 END), 0) AS volume_24h,
      COUNT(t.id) AS trade_count,
      COUNT(DISTINCT t.trader_address) AS holder_count,
      (LOG(COALESCE(SUM(t.volume::NUMERIC), 0) + 1) * 10
       + COUNT(t.id) * 2
       + COUNT(DISTINCT t.trader_address) * 5
       + LOG(COALESCE(SUM(CASE WHEN t.created_at > NOW() - INTERVAL '24 hours' THEN t.volume::NUMERIC ELSE 0 END), 0) + 1) * 30
      ) AS score
    FROM token_metadata tm
    LEFT JOIN trades t ON t.token_address = tm.token_address
    GROUP BY tm.token_address, tm.name, tm.symbol, tm.image_url, tm.creator_address
  ),
  sorted AS (
    SELECT ts.*,
      ROW_NUMBER() OVER (
        ORDER BY
          CASE WHEN p_sort_by = 'volume' THEN ts.total_volume END DESC NULLS LAST,
          CASE WHEN p_sort_by = 'volume24h' THEN ts.volume_24h END DESC NULLS LAST,
          CASE WHEN p_sort_by = 'trades' THEN ts.trade_count END DESC NULLS LAST,
          CASE WHEN p_sort_by = 'holders' THEN ts.holder_count END DESC NULLS LAST,
          CASE WHEN p_sort_by = 'trending' THEN ts.score END DESC NULLS LAST,
          ts.total_volume DESC NULLS LAST
      ) AS rank
    FROM token_stats ts
  ),
  platform AS (
    SELECT
      COUNT(*) AS total_tokens,
      COALESCE(SUM(total_volume), 0) AS total_volume,
      COALESCE(SUM(trade_count), 0) AS total_trades,
      COALESCE(SUM(volume_24h), 0) AS platform_volume_24h
    FROM token_stats
  )
  SELECT json_build_object(
    'leaderboard', COALESCE((
      SELECT json_agg(json_build_object(
        'rank', s.rank,
        'tokenAddress', s.token_address,
        'name', s.name,
        'symbol', s.symbol,
        'imageUrl', s.image_url,
        'creatorAddress', s.creator_address,
        'totalVolume', s.total_volume::TEXT,
        'volume24h', s.volume_24h::TEXT,
        'tradeCount', s.trade_count,
        'holderCount', s.holder_count,
        'score', s.score
      ) ORDER BY s.rank)
      FROM sorted s
      WHERE s.rank <= p_limit
    ), '[]'::JSON),
    'platformStats', (
      SELECT json_build_object(
        'totalTokens', p.total_tokens,
        'totalVolume', p.total_volume::TEXT,
        'totalTrades', p.total_trades,
        'volume24h', p.platform_volume_24h::TEXT
      )
      FROM platform p
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;


-- ============================================================
-- 3. get_creator_leaderboard
-- Creator leaderboard grouped by creator_address
-- Replaces: getCreatorLeaderboard() in app/api/leaderboard/route.ts
-- ============================================================

CREATE OR REPLACE FUNCTION get_creator_leaderboard(
  p_sort_by TEXT DEFAULT 'volume',
  p_limit INT DEFAULT 20
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  WITH creator_stats AS (
    SELECT
      tm.creator_address,
      COUNT(DISTINCT tm.token_address) AS token_count,
      COALESCE(SUM(t.volume::NUMERIC), 0) AS total_volume,
      COUNT(t.id) AS total_trades,
      COALESCE(SUM(t.volume::NUMERIC), 0) * 0.01 AS total_earnings
    FROM token_metadata tm
    LEFT JOIN trades t ON t.token_address = tm.token_address
    GROUP BY tm.creator_address
  ),
  with_users AS (
    SELECT
      cs.*,
      u.username,
      u.avatar_url,
      ROW_NUMBER() OVER (
        ORDER BY
          CASE WHEN p_sort_by = 'volume' THEN cs.total_volume END DESC NULLS LAST,
          CASE WHEN p_sort_by = 'tokens' THEN cs.token_count END DESC NULLS LAST,
          CASE WHEN p_sort_by = 'earnings' THEN cs.total_earnings END DESC NULLS LAST,
          cs.total_volume DESC NULLS LAST
      ) AS rank
    FROM creator_stats cs
    LEFT JOIN users u ON u.address = cs.creator_address
  ),
  platform AS (
    SELECT
      COUNT(*) AS total_creators,
      COALESCE(SUM(total_volume), 0) AS total_volume,
      COALESCE(SUM(token_count), 0) AS total_tokens
    FROM creator_stats
  )
  SELECT json_build_object(
    'leaderboard', COALESCE((
      SELECT json_agg(json_build_object(
        'rank', w.rank,
        'address', w.creator_address,
        'username', w.username,
        'avatar', w.avatar_url,
        'tokenCount', w.token_count,
        'totalVolume', w.total_volume::TEXT,
        'totalTrades', w.total_trades,
        'totalEarnings', w.total_earnings::TEXT
      ) ORDER BY w.rank)
      FROM with_users w
      WHERE w.rank <= p_limit
    ), '[]'::JSON),
    'platformStats', (
      SELECT json_build_object(
        'totalCreators', p.total_creators,
        'totalVolume', p.total_volume::TEXT,
        'totalTokens', p.total_tokens
      )
      FROM platform p
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;


-- ============================================================
-- 4. get_token_analytics
-- Detailed per-token analytics
-- Replaces: app/api/tokens/analytics/route.ts
-- ============================================================

CREATE OR REPLACE FUNCTION get_token_analytics(
  p_token_address TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_normalized TEXT;
  v_result JSON;
BEGIN
  v_normalized := LOWER(p_token_address);

  WITH base_stats AS (
    SELECT
      COALESCE(SUM(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN volume::NUMERIC ELSE 0 END), 0) AS volume_24h,
      COALESCE(SUM(CASE WHEN created_at > NOW() - INTERVAL '48 hours' AND created_at <= NOW() - INTERVAL '24 hours' THEN volume::NUMERIC ELSE 0 END), 0) AS volume_prev_24h,
      COALESCE(SUM(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN volume::NUMERIC ELSE 0 END), 0) AS volume_7d,
      COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') AS trade_count_24h,
      COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') AS trade_count_7d,
      COUNT(*) AS trade_count_total,
      COUNT(DISTINCT trader_address) AS holder_count
    FROM trades
    WHERE token_address = v_normalized
  ),
  volume_change AS (
    SELECT
      CASE WHEN bs.volume_prev_24h > 0
        THEN ((bs.volume_24h - bs.volume_prev_24h) / bs.volume_prev_24h) * 100
        ELSE CASE WHEN bs.volume_24h > 0 THEN 100 ELSE 0 END
      END AS volume_change_24h
    FROM base_stats bs
  ),
  -- Price change 24h: first and last trade prices
  price_24h AS (
    SELECT
      (SELECT volume::NUMERIC / NULLIF(token_amount::NUMERIC, 0)
       FROM trades WHERE token_address = v_normalized AND created_at > NOW() - INTERVAL '24 hours'
       ORDER BY created_at ASC LIMIT 1
      ) AS first_price,
      (SELECT volume::NUMERIC / NULLIF(token_amount::NUMERIC, 0)
       FROM trades WHERE token_address = v_normalized AND created_at > NOW() - INTERVAL '24 hours'
       ORDER BY created_at DESC LIMIT 1
      ) AS last_price
  ),
  -- Price change 7d
  price_7d AS (
    SELECT
      (SELECT volume::NUMERIC / NULLIF(token_amount::NUMERIC, 0)
       FROM trades WHERE token_address = v_normalized AND created_at > NOW() - INTERVAL '7 days'
       ORDER BY created_at ASC LIMIT 1
      ) AS first_price,
      (SELECT volume::NUMERIC / NULLIF(token_amount::NUMERIC, 0)
       FROM trades WHERE token_address = v_normalized AND created_at > NOW() - INTERVAL '7 days'
       ORDER BY created_at DESC LIMIT 1
      ) AS last_price
  ),
  -- New holders this week (traders seen in last 7d but not before)
  holder_growth AS (
    SELECT COUNT(DISTINCT t1.trader_address) AS new_holders_7d
    FROM trades t1
    WHERE t1.token_address = v_normalized
      AND t1.created_at > NOW() - INTERVAL '7 days'
      AND NOT EXISTS (
        SELECT 1 FROM trades t2
        WHERE t2.token_address = v_normalized
          AND t2.trader_address = t1.trader_address
          AND t2.created_at <= NOW() - INTERVAL '7 days'
      )
  ),
  -- Hourly volume for last 24 hours
  hours AS (
    SELECT generate_series(
      date_trunc('hour', NOW() - INTERVAL '23 hours'),
      date_trunc('hour', NOW()),
      '1 hour'::INTERVAL
    ) AS hour_start
  ),
  hourly AS (
    SELECT
      h.hour_start + INTERVAL '1 hour' AS hour_end,
      COALESCE(SUM(t.volume::NUMERIC), 0) AS volume
    FROM hours h
    LEFT JOIN trades t ON t.token_address = v_normalized
      AND t.created_at >= h.hour_start
      AND t.created_at < h.hour_start + INTERVAL '1 hour'
    GROUP BY h.hour_start
    ORDER BY h.hour_start
  )
  SELECT json_build_object(
    'volume24h', (SELECT volume_24h FROM base_stats),
    'volume7d', (SELECT volume_7d FROM base_stats),
    'volumeChange24h', (SELECT volume_change_24h FROM volume_change),
    'priceChange24h', CASE
      WHEN (SELECT first_price FROM price_24h) IS NOT NULL AND (SELECT first_price FROM price_24h) > 0
      THEN ((SELECT last_price FROM price_24h) - (SELECT first_price FROM price_24h)) / (SELECT first_price FROM price_24h) * 100
      ELSE NULL
    END,
    'priceChange7d', CASE
      WHEN (SELECT first_price FROM price_7d) IS NOT NULL AND (SELECT first_price FROM price_7d) > 0
      THEN ((SELECT last_price FROM price_7d) - (SELECT first_price FROM price_7d)) / (SELECT first_price FROM price_7d) * 100
      ELSE NULL
    END,
    'tradeCount24h', (SELECT trade_count_24h FROM base_stats),
    'tradeCount7d', (SELECT trade_count_7d FROM base_stats),
    'tradeCountTotal', (SELECT trade_count_total FROM base_stats),
    'holderCount', (SELECT holder_count FROM base_stats),
    'holderGrowth7d', (SELECT new_holders_7d FROM holder_growth),
    'hourlyVolume', COALESCE((
      SELECT json_agg(json_build_object(
        'hour', hv.hour_end,
        'volume', hv.volume
      ) ORDER BY hv.hour_end)
      FROM hourly hv
    ), '[]'::JSON)
  ) INTO v_result;

  RETURN v_result;
END;
$$;


-- ============================================================
-- 5. get_token_recommendations
-- Collaborative filtering: "users who bought X also bought Y"
-- Replaces: app/api/tokens/recommendations/route.ts
-- ============================================================

CREATE OR REPLACE FUNCTION get_token_recommendations(
  p_token_address TEXT,
  p_limit INT DEFAULT 4
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_normalized TEXT;
  v_result JSON;
BEGIN
  v_normalized := LOWER(p_token_address);

  WITH
  -- 1. Find all buyers of the target token
  token_buyers AS (
    SELECT DISTINCT trader_address
    FROM trades
    WHERE token_address = v_normalized AND type = 'buy'
  ),
  -- 2. Find other tokens those buyers also bought, count shared traders
  shared_tokens AS (
    SELECT
      t.token_address,
      COUNT(DISTINCT t.trader_address) AS shared_traders
    FROM trades t
    INNER JOIN token_buyers tb ON tb.trader_address = t.trader_address
    WHERE t.type = 'buy' AND t.token_address != v_normalized
    GROUP BY t.token_address
    ORDER BY shared_traders DESC
    LIMIT p_limit
  ),
  -- 3. Get metadata + stats for recommended tokens
  rec_with_meta AS (
    SELECT
      st.token_address,
      st.shared_traders,
      tm.name,
      tm.symbol,
      tm.image_url,
      COALESCE(tm.category, 'meme') AS category,
      COUNT(DISTINCT t.trader_address) AS total_holders,
      COALESCE(SUM(CASE WHEN t.created_at > NOW() - INTERVAL '24 hours' THEN t.volume::NUMERIC ELSE 0 END), 0) AS volume_24h
    FROM shared_tokens st
    LEFT JOIN token_metadata tm ON tm.token_address = st.token_address
    LEFT JOIN trades t ON t.token_address = st.token_address
    GROUP BY st.token_address, st.shared_traders, tm.name, tm.symbol, tm.image_url, tm.category
    ORDER BY st.shared_traders DESC
  )
  SELECT json_build_object(
    'recommendations', COALESCE((
      SELECT json_agg(json_build_object(
        'tokenAddress', r.token_address,
        'name', COALESCE(r.name, 'Unknown'),
        'symbol', COALESCE(r.symbol, '???'),
        'imageUrl', r.image_url,
        'category', r.category,
        'sharedTraders', r.shared_traders,
        'totalHolders', r.total_holders,
        'volume24h', r.volume_24h
      ) ORDER BY r.shared_traders DESC)
      FROM rec_with_meta r
    ), '[]'::JSON)
  ) INTO v_result;

  RETURN v_result;
END;
$$;


-- ============================================================
-- 6. get_activity_feed
-- Platform-wide activity feed with joins
-- Replaces: app/api/activity/route.ts
-- ============================================================

CREATE OR REPLACE FUNCTION get_activity_feed(
  p_type TEXT DEFAULT 'all',
  p_token TEXT DEFAULT NULL,
  p_following TEXT[] DEFAULT NULL,
  p_limit INT DEFAULT 30,
  p_before TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  WITH
  -- Trade activities (buys and sells)
  trade_items AS (
    SELECT
      t.id::TEXT AS id,
      t.type,
      t.token_address,
      COALESCE(tm.name, 'Unknown') AS token_name,
      COALESCE(tm.symbol, '???') AS token_symbol,
      tm.image_url AS token_image,
      t.trader_address,
      u.username AS trader_name,
      u.avatar_url AS trader_avatar,
      t.volume,
      t.token_amount,
      t.tx_hash,
      t.created_at
    FROM trades t
    LEFT JOIN token_metadata tm ON tm.token_address = t.token_address
    LEFT JOIN users u ON u.address = t.trader_address
    WHERE
      p_type != 'creates'
      AND (p_type = 'all' OR p_type = 'buys' AND t.type = 'buy' OR p_type = 'sells' AND t.type = 'sell' OR p_type = 'following')
      AND (p_token IS NULL OR t.token_address = LOWER(p_token))
      AND (p_before IS NULL OR t.created_at < p_before)
      AND (p_following IS NULL OR tm.creator_address = ANY(p_following))
    ORDER BY t.created_at DESC
    LIMIT p_limit
  ),
  -- Token creation activities
  create_items AS (
    SELECT
      'create-' || tm.token_address AS id,
      'create'::TEXT AS type,
      tm.token_address,
      tm.name AS token_name,
      tm.symbol AS token_symbol,
      tm.image_url AS token_image,
      tm.creator_address AS trader_address,
      u.username AS trader_name,
      u.avatar_url AS trader_avatar,
      '0'::TEXT AS volume,
      '0'::TEXT AS token_amount,
      NULL::TEXT AS tx_hash,
      tm.created_at
    FROM token_metadata tm
    LEFT JOIN users u ON u.address = tm.creator_address
    WHERE
      (p_type = 'all' OR p_type = 'creates')
      AND (p_before IS NULL OR tm.created_at < p_before)
      AND (p_following IS NULL OR tm.creator_address = ANY(p_following))
    ORDER BY tm.created_at DESC
    LIMIT p_limit
  ),
  -- Combine and sort
  combined AS (
    SELECT * FROM trade_items
    UNION ALL
    SELECT * FROM create_items
    ORDER BY created_at DESC
    LIMIT p_limit
  )
  SELECT json_build_object(
    'items', COALESCE((
      SELECT json_agg(json_build_object(
        'id', c.id,
        'type', c.type,
        'tokenAddress', c.token_address,
        'tokenName', c.token_name,
        'tokenSymbol', c.token_symbol,
        'tokenImage', c.token_image,
        'traderAddress', c.trader_address,
        'traderName', c.trader_name,
        'traderAvatar', c.trader_avatar,
        'volume', c.volume,
        'tokenAmount', c.token_amount,
        'txHash', c.tx_hash,
        'createdAt', c.created_at
      ) ORDER BY c.created_at DESC)
      FROM combined c
    ), '[]'::JSON),
    'nextCursor', (
      SELECT created_at FROM combined ORDER BY created_at ASC LIMIT 1
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;
