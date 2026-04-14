-- =============================================================
-- EmbedPress E2E Test Seed Data
-- Import AFTER WordPress core install (tables must exist).
-- Uses IDs 100-102 to avoid collisions with WP default posts.
-- =============================================================

-- Ensure clean state on re-import
DELETE FROM wp_postmeta WHERE post_id IN (100, 101, 102);
DELETE FROM wp_posts     WHERE ID       IN (100, 101, 102);

-- =============================================================
-- 1. Gutenberg page — EmbedPress YouTube block
-- =============================================================
INSERT INTO wp_posts
  (ID, post_author, post_date, post_date_gmt,
   post_content, post_title, post_status, post_type,
   post_name, comment_status, ping_status,
   to_ping, pinged, post_content_filtered, post_excerpt, guid)
VALUES (
  100, 1,
  '2024-01-01 00:00:00', '2024-01-01 00:00:00',
  '<!-- wp:embedpress/embedpress {"url":"https://www.youtube.com/watch?v=jNQXAC9IVRw"} -->\n<figure class="wp-block-embedpress-embedpress"><div class="ep-embed-content-wraper"></div></figure>\n<!-- /wp:embedpress/embedpress -->',
  'EP Gutenberg YouTube Test',
  'publish', 'page',
  'ep-gutenberg-youtube-test',
  'open', 'open',
  '', '', '', '',
  'http://localhost:8080/?page_id=100'
);

INSERT INTO wp_postmeta (post_id, meta_key, meta_value) VALUES
  (100, '_wp_page_template', 'default');

-- =============================================================
-- 2. Classic Editor page — EmbedPress shortcode
-- =============================================================
INSERT INTO wp_posts
  (ID, post_author, post_date, post_date_gmt,
   post_content, post_title, post_status, post_type,
   post_name, comment_status, ping_status,
   to_ping, pinged, post_content_filtered, post_excerpt, guid)
VALUES (
  101, 1,
  '2024-01-01 00:00:00', '2024-01-01 00:00:00',
  '[embedpress]https://www.youtube.com/watch?v=jNQXAC9IVRw[/embedpress]',
  'EP Classic YouTube Test',
  'publish', 'page',
  'ep-classic-youtube-test',
  'open', 'open',
  '', '', '', '',
  'http://localhost:8080/?page_id=101'
);

INSERT INTO wp_postmeta (post_id, meta_key, meta_value) VALUES
  (101, '_wp_page_template', 'default'),
  (101, 'classic-editor', '1');

-- =============================================================
-- 3. Elementor page — EmbedPress widget
-- =============================================================
INSERT INTO wp_posts
  (ID, post_author, post_date, post_date_gmt,
   post_content, post_title, post_status, post_type,
   post_name, comment_status, ping_status,
   to_ping, pinged, post_content_filtered, post_excerpt, guid)
VALUES (
  102, 1,
  '2024-01-01 00:00:00', '2024-01-01 00:00:00',
  '',
  'EP Elementor YouTube Test',
  'publish', 'page',
  'ep-elementor-youtube-test',
  'open', 'open',
  '', '', '', '',
  'http://localhost:8080/?page_id=102'
);

-- Elementor meta: tells Elementor this page is builder-managed
INSERT INTO wp_postmeta (post_id, meta_key, meta_value) VALUES
  (102, '_wp_page_template',   'elementor_header_footer'),
  (102, '_elementor_edit_mode','builder'),
  (102, '_elementor_template_type', 'wp-page'),
  (102, '_elementor_version',  '3.18.0'),
  (102, '_elementor_data',
   '[{"id":"s1a2b3c4","elType":"section","settings":{},"elements":[{"id":"c5d6e7f8","elType":"column","settings":{"_column_size":100,"_inline_size":null},"elements":[{"id":"w9a0b1c2","elType":"widget","widgetType":"embedpress","settings":{"url":"https://www.youtube.com/watch?v=jNQXAC9IVRw","width":"600","height":"450"},"elements":[],"isInner":false}],"isInner":false}],"isInner":false}]'
  );
