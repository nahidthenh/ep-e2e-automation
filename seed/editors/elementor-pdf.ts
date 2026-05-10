/**
 * Builds the `_elementor_data` payload for the EmbedPress PDF widget
 * (`embedpress_pdf`), which is a different widget from the generic
 * `embedpres_elementor` (note the missing trailing 's' — that typo is
 * intentional in EmbedPress and must stay).
 *
 * Key settings:
 *   - `embedpress_pdf_type`: 'url' | 'file' — we use 'url' because the seed
 *     uploads the PDF via `wp media import` and gets back the attachment URL.
 *   - `embedpress_pdf_file_link`: { url, id } — Elementor's media-control shape.
 *   - `embedpress_pdf_toolbar` / `embedpress_pdf_download` / etc. — bool toggles.
 *
 * `extraSettings` merges control-variant overrides on top of the defaults.
 */
export function buildElementorPdfData(
  pdfUrl: string,
  extraSettings: Record<string, unknown> = {},
): string {
  // Setting keys discovered by reading EmbedPress's Embedpress_Pdf widget:
  //  - `embedpress_pdf_type`     — 'url' uses `embedpress_pdf_file_link.url`
  //  - `pdf_toolbar`             — toolbar visibility (SWITCHER 'yes' / '')
  //  - `pdf_print_download`      — download button (SWITCHER 'yes' / '')
  //                               Conditioned on pdf_toolbar='yes'.
  //  - `pdf_presentation_mode`, `pdf_zoom_in`, etc. — same SWITCHER pattern.
  const widgetSettings: Record<string, unknown> = {
    embedpress_pdf_type: 'url',
    embedpress_pdf_file_link: { url: pdfUrl, id: '' },
    pdf_toolbar: 'yes',
    pdf_print_download: 'yes',
    pdf_presentation_mode: 'yes',
    embedpress_pdf_powered_by: '',
    width: { unit: 'px', size: 600 },
    height: { unit: 'px', size: 450 },
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
              widgetType: 'embedpress_pdf',
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
