/**
 * Builds Gutenberg block markup for the `embedpress/pdf-gallery` block.
 *
 * The block is static (no PHP render callback), but EmbedPress also registers
 * an `embedpress_pdf_gallery` shortcode that produces identical HTML. Wrapping
 * the shortcode in a `wp:shortcode` block lets WordPress resolve it at render
 * time without having to pre-generate the full save() output (which requires
 * base64-encoding viewer params and replicating the JSX tree in TypeScript).
 */
export function buildGutenbergPdfGalleryContent(pdfUrl: string): string {
  const shortcode = `[embedpress_pdf_gallery urls="${pdfUrl}" layout="grid" columns="3"]`;
  return `<!-- wp:shortcode -->\n${shortcode}\n<!-- /wp:shortcode -->`;
}
