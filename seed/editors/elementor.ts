/**
 * Builds the JSON payload stored in `_elementor_data` postmeta.
 *
 * Notes on EmbedPress quirks (intentional, do not "fix"):
 *  - widgetType is `embedpres_elementor` (missing trailing 's' in "embedpress")
 *  - URL key is `embedpress_embeded_link` (typo: "embeded" vs. "embedded")
 *
 * Both names come straight from EmbedPress source — changing them breaks rendering.
 */
export function buildElementorData(url: string): string {
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
              widgetType: 'embedpres_elementor',
              settings: {
                embedpress_embeded_link: url,
                width: '600',
                height: '450',
              },
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
