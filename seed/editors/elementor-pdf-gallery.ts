/**
 * Builds the `_elementor_data` payload for the EmbedPress PDF Gallery widget
 * (`embedpress_pdf_gallery`).
 *
 * Key settings:
 *   - `pdf_items_json`: JSON string of item objects {id, url, fileName, …}
 *   - `layout`: 'grid' | 'masonry' | 'carousel' | 'bookshelf'
 *     (carousel/bookshelf are Pro-gated — widget PHP falls back to 'grid' when Pro absent)
 *   - `pdf_toolbar` / `download`: SWITCHER ('yes'/'') — Pro-gated viewer params
 *   - `presentation`: SWITCHER ('yes'/'') — controls viewer presentation mode
 *   - `gap` / `border_radius`: slider shape `{unit:'px', size:N}`
 *   - carousel controls: `carousel_loop`, `carousel_arrows`, `carousel_dots` (SWITCHER)
 *
 * The widget renders `canvas.ep-pdf-gallery__canvas[data-pdf-src]` per item (no
 * iframes). Viewer params are base64-encoded into `data-viewer-params` on the
 * `.ep-pdf-gallery` container.
 *
 * `extraSettings` is merged last — any key overrides the default.
 */
export function buildElementorPdfGalleryData(
  pdfUrl: string,
  extraSettings: Record<string, unknown> = {},
): string {
  const fileName = pdfUrl.split('/').pop() || 'sample.pdf';
  const pdfItems = JSON.stringify([
    {
      id: 0,
      url: pdfUrl,
      fileName,
      customThumbnailId: 0,
      customThumbnailUrl: '',
      autoThumbnailId: 0,
      autoThumbnailUrl: '',
    },
  ]);

  const widgetSettings: Record<string, unknown> = {
    pdf_items_json: pdfItems,
    // Layout
    layout: 'grid',
    columns: '3',
    columns_tablet: '2',
    columns_mobile: '1',
    gap: { unit: 'px', size: 20 },
    border_radius: { unit: 'px', size: 8 },
    aspect_ratio: '4:3',
    // Carousel controls (ignored by PHP unless layout='carousel'/'bookshelf')
    carousel_loop: 'yes',
    carousel_arrows: 'yes',
    carousel_dots: '',
    // PDF Viewer (popup) controls
    pdf_toolbar: 'yes',
    toolbar_position: 'top',
    presentation: 'yes',
    download: 'yes',
    ...extraSettings,
  };

  const data = [
    {
      id: randomId(),
      elType: 'section',
      settings: {},
      elements: [
        {
          id: randomId(),
          elType: 'column',
          settings: { _column_size: 100, _inline_size: null },
          elements: [
            {
              id: randomId(),
              elType: 'widget',
              widgetType: 'embedpress_pdf_gallery',
              settings: widgetSettings,
              elements: [],
              isInner: false,
            },
          ],
          isInner: false,
        },
      ],
      isInner: false,
    },
  ];
  return JSON.stringify(data);
}

function randomId(): string {
  return Math.random().toString(36).substring(2, 10);
}
