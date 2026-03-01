-- Wave 7: Social Feed - Postgres Functions
-- Run this in Supabase SQL Editor after wave7-social-feed-migration.sql

-- ============================================================
-- get_social_feed
-- Paginated social feed with author info and interaction state
-- ============================================================
CREATE OR REPLACE FUNCTION get_social_feed(
  p_feed_type TEXT DEFAULT 'global',
  p_user_address TEXT DEFAULT NULL,
  p_target_address TEXT DEFAULT NULL,
  p_following TEXT[] DEFAULT NULL,
  p_limit INT DEFAULT 20,
  p_before TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  WITH filtered_posts AS (
    SELECT p.*
    FROM posts p
    WHERE p.is_deleted = FALSE
      AND (p_before IS NULL OR p.created_at < p_before)
      AND (
        CASE
          WHEN p_feed_type = 'global' THEN TRUE
          WHEN p_feed_type = 'following' AND p_following IS NOT NULL THEN p.author_address = ANY(p_following)
          WHEN p_feed_type = 'user' AND p_target_address IS NOT NULL THEN p.author_address = LOWER(p_target_address)
          WHEN p_feed_type = 'token' AND p_target_address IS NOT NULL THEN p.token_tags @> to_jsonb(LOWER(p_target_address))::JSONB
          ELSE TRUE
        END
      )
    ORDER BY p.created_at DESC
    LIMIT p_limit
  ),
  posts_with_author AS (
    SELECT
      fp.*,
      u.username AS author_username,
      u.avatar_url AS author_avatar,
      CASE WHEN p_user_address IS NOT NULL
        THEN EXISTS(SELECT 1 FROM post_likes pl WHERE pl.post_id = fp.id AND pl.user_address = LOWER(p_user_address))
        ELSE FALSE
      END AS user_liked,
      CASE WHEN p_user_address IS NOT NULL
        THEN EXISTS(SELECT 1 FROM reposts rp WHERE rp.post_id = fp.id AND rp.user_address = LOWER(p_user_address))
        ELSE FALSE
      END AS user_reposted
    FROM filtered_posts fp
    LEFT JOIN users u ON u.address = fp.author_address
  ),
  originals AS (
    SELECT
      op.id AS original_id,
      op.author_address AS original_author_address,
      op.content AS original_content,
      op.images AS original_images,
      op.token_tags AS original_token_tags,
      op.link_url AS original_link_url,
      op.link_title AS original_link_title,
      op.link_description AS original_link_description,
      op.link_image AS original_link_image,
      op.like_count AS original_like_count,
      op.comment_count AS original_comment_count,
      op.repost_count AS original_repost_count,
      op.created_at AS original_created_at,
      ou.username AS original_author_username,
      ou.avatar_url AS original_author_avatar
    FROM posts op
    LEFT JOIN users ou ON ou.address = op.author_address
    WHERE op.id IN (SELECT repost_of FROM posts_with_author WHERE repost_of IS NOT NULL)
  )
  SELECT json_build_object(
    'posts', COALESCE((
      SELECT json_agg(json_build_object(
        'id', pa.id,
        'authorAddress', pa.author_address,
        'authorUsername', pa.author_username,
        'authorAvatar', pa.author_avatar,
        'content', pa.content,
        'images', pa.images,
        'tokenTags', pa.token_tags,
        'linkUrl', pa.link_url,
        'linkTitle', pa.link_title,
        'linkDescription', pa.link_description,
        'linkImage', pa.link_image,
        'repostOf', pa.repost_of,
        'likeCount', pa.like_count,
        'commentCount', pa.comment_count,
        'repostCount', pa.repost_count,
        'userLiked', pa.user_liked,
        'userReposted', pa.user_reposted,
        'createdAt', pa.created_at,
        'originalPost', CASE WHEN pa.repost_of IS NOT NULL THEN (
          SELECT json_build_object(
            'id', o.original_id,
            'authorAddress', o.original_author_address,
            'authorUsername', o.original_author_username,
            'authorAvatar', o.original_author_avatar,
            'content', o.original_content,
            'images', o.original_images,
            'tokenTags', o.original_token_tags,
            'linkUrl', o.original_link_url,
            'linkTitle', o.original_link_title,
            'linkDescription', o.original_link_description,
            'linkImage', o.original_link_image,
            'likeCount', o.original_like_count,
            'commentCount', o.original_comment_count,
            'repostCount', o.original_repost_count,
            'createdAt', o.original_created_at
          )
          FROM originals o WHERE o.original_id = pa.repost_of
        ) ELSE NULL END
      ) ORDER BY pa.created_at DESC)
      FROM posts_with_author pa
    ), '[]'::JSON),
    'nextCursor', (
      SELECT created_at FROM posts_with_author ORDER BY created_at ASC LIMIT 1
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- ============================================================
-- get_post_comments
-- Paginated comments for a post with author info
-- ============================================================
CREATE OR REPLACE FUNCTION get_post_comments(
  p_post_id UUID,
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'comments', COALESCE((
      SELECT json_agg(json_build_object(
        'id', pc.id,
        'postId', pc.post_id,
        'authorAddress', pc.author_address,
        'authorUsername', u.username,
        'authorAvatar', u.avatar_url,
        'content', pc.content,
        'createdAt', pc.created_at
      ) ORDER BY pc.created_at ASC)
      FROM (
        SELECT * FROM post_comments
        WHERE post_id = p_post_id AND is_deleted = FALSE
        ORDER BY created_at ASC
        LIMIT p_limit OFFSET p_offset
      ) pc
      LEFT JOIN users u ON u.address = pc.author_address
    ), '[]'::JSON),
    'totalCount', (
      SELECT COUNT(*) FROM post_comments WHERE post_id = p_post_id AND is_deleted = FALSE
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;
