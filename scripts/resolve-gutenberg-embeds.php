<?php
/**
 * Post-seed step: rewrite every `ep-gutenberg-*` page's post_content so the
 * `embedpress/embedpress` block carries the resolved iframe HTML in both its
 * inner content and the `embedHTML` attribute — matching exactly what the
 * Gutenberg editor saves after fetching oEmbed.
 *
 * Run via WP-CLI inside the WP container. Idempotent: if the iframe is
 * already baked in, re-resolving still produces the same markup.
 */

global $wpdb;

$rows = $wpdb->get_results(
    "SELECT ID, post_name, post_content
     FROM {$wpdb->posts}
     WHERE post_name LIKE 'ep-gutenberg-%'
       AND post_status = 'publish'"
);

$updated = 0;
$skipped = 0;
foreach ($rows as $row) {
    $blocks = parse_blocks($row->post_content);
    if (empty($blocks)) {
        $skipped++;
        continue;
    }

    // Find the first embedpress/embedpress block at the top level.
    $idx = null;
    foreach ($blocks as $i => $b) {
        if (($b['blockName'] ?? '') === 'embedpress/embedpress') {
            $idx = $i;
            break;
        }
    }
    if ($idx === null) {
        $skipped++;
        continue;
    }

    $attrs = $blocks[$idx]['attrs'] ?? [];
    $url = $attrs['url'] ?? $attrs['href'] ?? '';
    if (empty($url)) {
        // Fall back to the [embedpress]URL[/embedpress] inside inner HTML.
        if (preg_match('/\[embedpress\](.+?)\[\/embedpress\]/', $blocks[$idx]['innerHTML'] ?? '', $m)) {
            $url = $m[1];
        }
    }
    if (empty($url)) {
        WP_CLI::warning("No URL found for {$row->post_name}; skipped.");
        $skipped++;
        continue;
    }

    // For sources whose render path honours block attributes (YouTube channel
    // layout/controls, etc.), `do_shortcode` discards them. Calling
    // `Shortcode::parseContent($url, true, $atts)` directly lets us pass the
    // block's attrs into the resolution. For URL-only embeds, $atts stays
    // empty and the result matches `do_shortcode`.
    $passthrough = ['ytChannelLayout', 'pagesize', 'columns', 'ispagination', 'gapbetweenvideos'];
    $atts = [];
    foreach ($passthrough as $key) {
        if (array_key_exists($key, $attrs)) {
            $atts[$key] = $attrs[$key];
        }
    }
    $parsed = \EmbedPress\Shortcode::parseContent($url, true, $atts);
    $iframe = trim($parsed->embed ?? '');
    if (empty($iframe)) {
        // Fallback to plain shortcode in case parseContent shape changed.
        $iframe = trim(do_shortcode('[embedpress]' . $url . '[/embedpress]'));
    }
    if (empty($iframe)) {
        WP_CLI::warning("Empty resolution for {$row->post_name} (url: {$url}); skipped.");
        $skipped++;
        continue;
    }

    $inner = '<figure class="wp-block-embedpress-embedpress">' . $iframe . '</figure>';
    // Preserve layout/control attrs so re-resolves stay deterministic and the
    // saved post_content matches what the editor would write.
    $preserved = array_intersect_key($attrs, array_flip($passthrough));
    $blocks[$idx]['attrs'] = array_merge($preserved, ['url' => $url, 'embedHTML' => $iframe]);
    $blocks[$idx]['innerHTML'] = $inner;
    $blocks[$idx]['innerContent'] = [$inner];

    $new_content = '';
    foreach ($blocks as $b) {
        $new_content .= serialize_block($b);
    }

    // Direct $wpdb update bypasses kses + content filters that strip iframe
    // attributes; the editor saves these blocks raw too.
    $wpdb->update(
        $wpdb->posts,
        ['post_content' => $new_content],
        ['ID' => $row->ID]
    );
    clean_post_cache($row->ID);
    $updated++;
}

WP_CLI::success("Resolved {$updated} Gutenberg embed(s); skipped {$skipped}.");
