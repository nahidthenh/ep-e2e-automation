/**
 * Builds Gutenberg block markup for the generic EmbedPress block.
 * The block accepts any URL — EmbedPress resolves the source server-side.
 */
export function buildGutenbergContent(url: string): string {
  const attrs = JSON.stringify({ href: url });
  return [
    `<!-- wp:embedpress/embedpress ${attrs} -->`,
    `<figure class="wp-block-embedpress-embedpress"><div class="embedpress-wrapper">${url}</div></figure>`,
    `<!-- /wp:embedpress/embedpress -->`,
  ].join('\n');
}
