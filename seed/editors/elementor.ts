/**
 * Builds the JSON payload stored in `_elementor_data` postmeta.
 *
 * Notes on EmbedPress quirks (intentional, do not "fix"):
 *  - widgetType is `embedpres_elementor` (missing trailing 's' in "embedpress")
 *  - URL key is `embedpress_embeded_link` (typo: "embeded" vs. "embedded")
 *
 * Both names come straight from EmbedPress source — changing them breaks rendering.
 *
 * `embedpress_pro_embeded_source` controls which set of source-specific
 * controls Elementor reveals in the editor sidebar. Without it, source-specific
 * controls (autoplay, end_time, etc.) stay hidden behind their `condition`,
 * which makes any "configure controls" e2e test fail. Values are the short
 * slugs EmbedPress Pro uses internally — see Embedpress_Elementor.php.
 */
export function buildElementorData(url: string, sourceName: string): string {
  const proSource = getProSourceKey(sourceName);

  const widgetSettings: Record<string, unknown> = {
    embedpress_embeded_link: url,
    width: '600',
    height: '450',
  };
  if (proSource) {
    widgetSettings.embedpress_pro_embeded_source = proSource;
  }

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

/**
 * Maps a `sources.json` display name to the short slug EmbedPress Pro uses
 * for `embedpress_pro_embeded_source`. Only the providers that actually have
 * source-specific Elementor controls are mapped — sources without dedicated
 * controls return `''` (the field is omitted, which is fine; nothing to gate).
 *
 * Extend this list as new providers gain source-specific Pro controls.
 */
function getProSourceKey(sourceName: string): string {
  const n = sourceName.toLowerCase();
  if (n.includes('youtube'))     return 'youtube';
  if (n.includes('vimeo'))       return 'vimeo';
  if (n.includes('spotify'))     return 'spotify';
  if (n.includes('twitch'))      return 'twitch';
  if (n.includes('wistia'))      return 'wistia';
  if (n.includes('dailymotion')) return 'dailymotion';
  if (n.includes('opensea'))     return 'opensea';
  if (n.includes('instagram'))   return 'instafeed';
  return '';
}

function randomId(): string {
  return Math.random().toString(36).substring(2, 10);
}
