/**
 * Builds Gutenberg block markup for the seeded page.
 *
 * Why the `embedpress/embedpress` block with the shortcode as inner HTML:
 * the block's render callback (`EmbedPressBlockRenderer::render`) only emits
 * iframe HTML when the editor populated `attributes.embedHTML` at save time
 * (a JS-only step). Seeded posts skip the editor, so we rely on the block's
 * early-return path: for non-dynamic providers it returns the inner HTML
 * verbatim, and the `[embedpress]…[/embedpress]` shortcode resolves to an
 * iframe in the next `the_content` filter step.
 *
 * The post-seed step (`scripts/resolve-gutenberg-embeds.php`) replaces this
 * scaffolding with the resolved iframe baked into both the block's inner
 * content and the `embedHTML` attribute, matching exactly what the Gutenberg
 * editor would have saved. That step also covers dynamic providers (Instagram,
 * OpenSea, Wistia, Google Photos) where the early-return is bypassed and
 * `embedHTML` is the only path the render callback honours.
 *
 * `extraAttrs` lets callers inject layout/control attributes (e.g.
 * `ytChannelLayout`, `pagesize`) so the resolve step can re-render with
 * non-default settings — used by the YouTube Channel layout-variant suite.
 */
export function buildGutenbergContent(
  url: string,
  extraAttrs: Record<string, unknown> = {},
): string {
  const attrs = JSON.stringify({ url, href: url, ...extraAttrs });
  return [
    `<!-- wp:embedpress/embedpress ${attrs} -->`,
    `<figure class="wp-block-embedpress-embedpress">[embedpress]${url}[/embedpress]</figure>`,
    `<!-- /wp:embedpress/embedpress -->`,
  ].join('\n');
}
