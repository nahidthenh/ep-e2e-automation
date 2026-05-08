/**
 * Builds Gutenberg block markup for the seeded page.
 *
 * Why the shortcode wrapper instead of `wp:embedpress/embedpress`:
 * the generic EmbedPress block is save-time-rendered in JS — its render
 * callback (EmbedPressBlockRenderer::render) only returns iframe HTML when
 * `attributes.embedHTML` was populated by the editor at save. Seeded posts
 * skip that step, so the block renders an empty inner div on the front-end.
 * The `[embedpress]URL[/embedpress]` shortcode resolves URL → iframe at
 * request time via Embera/oEmbed, so the seeded page produces a real iframe
 * without ever opening the editor.
 */
export function buildGutenbergContent(url: string): string {
  return [
    `<!-- wp:shortcode -->`,
    `[embedpress]${url}[/embedpress]`,
    `<!-- /wp:shortcode -->`,
  ].join('\n');
}
