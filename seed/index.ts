/**
 * Seed generator. Reads sources.json and emits SQL to stdout that:
 *   - Removes any previously-seeded ep-gutenberg-* / ep-elementor-* pages
 *     (or only the targeted source/editor when filters are passed).
 *   - Inserts one page per (source × editor) with EmbedPress markup ready to render.
 *
 * Usage (typically via `bash scripts/seed-pages.sh`):
 *   tsx seed/index.ts                          # all sources × {gutenberg, elementor}
 *   tsx seed/index.ts --source YouTube         # one source, both editors
 *   tsx seed/index.ts --editor gutenberg       # all sources, Gutenberg only
 *   tsx seed/index.ts --source YouTube --editor elementor
 *
 * The output is meant to be piped into MySQL inside the docker container:
 *   tsx seed/index.ts | docker exec -i ep_e2e_db mysql -uwpuser -pwppass wordpress
 */
import { Editor, Source, getSources, pageSlug, pageTitle } from './sources';
import { buildGutenbergContent } from './editors/gutenberg';
import { buildElementorData } from './editors/elementor';

// Start above the range WordPress uses for auto-drafts, wp_navigation,
// and wp_global_styles so the seeded IDs don't collide with system posts
// created during normal admin activity. Bumped from 1000 once the YouTube
// Channel variants pushed the seed range past 1183, which is where WP's
// system posts started landing in this environment.
const SEED_ID_START = 10000;
const ELEMENTOR_VERSION = '3.18.0';

/**
 * Variant of a source — when present, the seed emits one page per variant
 * with the variant's slug suffix and attribute overrides. Used today for
 * YouTube Channel's layout × control matrix; the architecture is intentionally
 * generic so other sources (Spotify, etc.) can adopt it later.
 */
interface Variant {
  /** Slug suffix appended to the source's base slug (e.g. `-list`). */
  suffix: string;
  /** Block attributes merged into `wp:embedpress/embedpress` at seed time. */
  gutenbergAttrs: Record<string, unknown>;
  /** Widget settings merged into the Elementor `_elementor_data` widget. */
  elementorSettings: Record<string, unknown>;
}

const VARIANTS_BY_SOURCE: Record<string, Variant[]> = {
  // YouTube Channel — exercises `ytChannelLayout` (gallery/list/grid/carousel)
  // and a controls variant (pagesize, ispagination). Grid + carousel are
  // gated by `apply_filters('embedpress/is_allow_rander')` which only Pro
  // sets — those specs Pro-skip when Pro is inactive.
  'YouTube Channel': [
    { suffix: '',           gutenbergAttrs: { ytChannelLayout: 'gallery' },  elementorSettings: { ytChannelLayout: 'gallery' } },
    { suffix: '-list',      gutenbergAttrs: { ytChannelLayout: 'list' },     elementorSettings: { ytChannelLayout: 'list' } },
    { suffix: '-grid',      gutenbergAttrs: { ytChannelLayout: 'grid' },     elementorSettings: { ytChannelLayout: 'grid' } },
    { suffix: '-carousel',  gutenbergAttrs: { ytChannelLayout: 'carousel' }, elementorSettings: { ytChannelLayout: 'carousel' } },
    {
      suffix: '-controls',
      gutenbergAttrs:    { ytChannelLayout: 'gallery', pagesize: '3', ispagination: false, gapbetweenvideos: 10 },
      elementorSettings: { ytChannelLayout: 'gallery', pagesize: '3', ispagination: '',    gapbetweenvideos: { unit: 'px', size: 10 } },
    },
  ],
};

function getVariants(sourceName: string): Variant[] {
  const overrides = VARIANTS_BY_SOURCE[sourceName];
  if (overrides && overrides.length > 0) return overrides;
  // Default: one variant with no suffix and no overrides — preserves the
  // historical 1-page-per-source behaviour for every other source.
  return [{ suffix: '', gutenbergAttrs: {}, elementorSettings: {} }];
}

interface CliArgs {
  source?: string;
  editor?: Editor;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--source') args.source = argv[++i];
    else if (argv[i] === '--editor') {
      const v = argv[++i];
      if (v !== 'gutenberg' && v !== 'elementor') {
        throw new Error(`--editor must be "gutenberg" or "elementor", got "${v}"`);
      }
      args.editor = v;
    }
  }
  return args;
}

function sqlEscape(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

interface Target {
  editor: Editor;
  sourceName: string;
  variant: Variant;
}

function variantSlug(editor: Editor, sourceName: string, variant: Variant): string {
  return pageSlug(editor, sourceName) + variant.suffix;
}

function variantTitle(editor: Editor, sourceName: string, variant: Variant): string {
  const base = pageTitle(editor, sourceName);
  return variant.suffix ? `${base} (${variant.suffix.replace(/^-/, '')})` : base;
}

function emitDeletes(targets: Target[]): string {
  const slugs = targets
    .map((t) => `'${variantSlug(t.editor, t.sourceName, t.variant)}'`)
    .join(', ');
  return [
    `DELETE FROM wp_postmeta WHERE post_id IN (SELECT ID FROM wp_posts WHERE post_name IN (${slugs}));`,
    `DELETE FROM wp_posts WHERE post_name IN (${slugs});`,
  ].join('\n');
}

function emitGutenberg(id: number, source: Source, variant: Variant): string {
  const slug = variantSlug('gutenberg', source.source, variant);
  const title = variantTitle('gutenberg', source.source, variant);
  const content = buildGutenbergContent(source.url!, variant.gutenbergAttrs);
  return `
-- ${source.source} (Gutenberg)
INSERT INTO wp_posts
  (ID, post_author, post_date, post_date_gmt,
   post_content, post_title, post_status, post_type,
   post_name, comment_status, ping_status,
   to_ping, pinged, post_content_filtered, post_excerpt, guid)
VALUES (
  ${id}, 1,
  '2024-01-01 00:00:00', '2024-01-01 00:00:00',
  '${sqlEscape(content)}',
  '${sqlEscape(title)}',
  'publish', 'page',
  '${slug}',
  'open', 'open',
  '', '', '', '',
  'http://localhost:8080/?page_id=${id}'
);
INSERT INTO wp_postmeta (post_id, meta_key, meta_value) VALUES
  (${id}, '_wp_page_template', 'default');
`;
}

function emitElementor(id: number, source: Source, variant: Variant): string {
  const slug = variantSlug('elementor', source.source, variant);
  const title = variantTitle('elementor', source.source, variant);
  const elementorData = buildElementorData(
    source.url!,
    source.source,
    variant.elementorSettings,
  );
  return `
-- ${source.source} (Elementor)
INSERT INTO wp_posts
  (ID, post_author, post_date, post_date_gmt,
   post_content, post_title, post_status, post_type,
   post_name, comment_status, ping_status,
   to_ping, pinged, post_content_filtered, post_excerpt, guid)
VALUES (
  ${id}, 1,
  '2024-01-01 00:00:00', '2024-01-01 00:00:00',
  '',
  '${sqlEscape(title)}',
  'publish', 'page',
  '${slug}',
  'open', 'open',
  '', '', '', '',
  'http://localhost:8080/?page_id=${id}'
);
INSERT INTO wp_postmeta (post_id, meta_key, meta_value) VALUES
  (${id}, '_wp_page_template',        'default'),
  (${id}, '_elementor_edit_mode',     'builder'),
  (${id}, '_elementor_template_type', 'wp-page'),
  (${id}, '_elementor_version',       '${ELEMENTOR_VERSION}'),
  (${id}, '_elementor_data',          '${sqlEscape(elementorData)}');
`;
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));

  const all = getSources().filter((s) => s.url);
  const filtered = args.source
    ? all.filter((s) => s.source.toLowerCase() === args.source!.toLowerCase())
    : all;

  if (args.source && filtered.length === 0) {
    process.stderr.write(
      `error: source "${args.source}" not found in sources.json (or its url is null)\n`,
    );
    process.exit(1);
  }

  const editors: Editor[] = args.editor
    ? [args.editor]
    : ['gutenberg', 'elementor'];

  const targets: Target[] = [];
  for (const s of filtered) {
    for (const v of getVariants(s.source)) {
      for (const e of editors) {
        targets.push({ editor: e, sourceName: s.source, variant: v });
      }
    }
  }

  const out: string[] = [
    '-- ╔═══════════════════════════════════════════════════════════╗',
    '-- ║ AUTO-GENERATED by seed/index.ts — do not edit by hand.    ║',
    '-- ╚═══════════════════════════════════════════════════════════╝',
    emitDeletes(targets),
  ];

  let nextId = SEED_ID_START;
  for (const s of filtered) {
    for (const v of getVariants(s.source)) {
      if (editors.includes('gutenberg')) out.push(emitGutenberg(nextId++, s, v));
      if (editors.includes('elementor')) out.push(emitElementor(nextId++, s, v));
    }
  }

  process.stdout.write(out.join('\n') + '\n');
  process.stderr.write(`✓ Generated ${targets.length} page(s) for ${filtered.length} source(s)\n`);
}

main();
