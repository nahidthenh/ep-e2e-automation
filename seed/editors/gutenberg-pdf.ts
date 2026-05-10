/**
 * Builds Gutenberg block markup for the `embedpress/embedpress-pdf` block.
 *
 * Why this is a separate builder from the generic `gutenberg.ts`: the PDF
 * block has its own render callback (`EmbedPressBlockRenderer::render_embedpress_pdf`)
 * that takes `href` + display attrs (`toolbar`, `download`, `presentation`,
 * `displayMode`, etc.) and produces an iframe at request time via the legacy
 * render path. No `embedHTML` resolve step needed — the block renders directly
 * from attributes when inner content is empty.
 *
 * `extraAttrs` lets callers inject control variants (no-download, lightbox,
 * etc.) — same shape as the YouTube Channel variant injection.
 */
export function buildGutenbergPdfContent(
  pdfUrl: string,
  extraAttrs: Record<string, unknown> = {},
): string {
  const blockId = 'embedpress-pdf-' + Math.floor(Math.random() * 1_000_000);
  const attrs = JSON.stringify({
    href: pdfUrl,
    id: blockId,
    width: '600',
    height: '550',
    toolbar: true,
    presentation: true,
    download: true,
    powered_by: false,
    displayMode: 'inline',
    ...extraAttrs,
  });
  // Self-closing block — empty inner content → render callback hits the
  // legacy renderer which builds the viewer iframe from the attributes.
  return `<!-- wp:embedpress/embedpress-pdf ${attrs} /-->`;
}
