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
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { Editor, Source, getSources, pageSlug, pageTitle } from './sources';
import { buildGutenbergContent } from './editors/gutenberg';
import { buildElementorData } from './editors/elementor';
import { buildGutenbergPdfContent } from './editors/gutenberg-pdf';
import { buildElementorPdfData } from './editors/elementor-pdf';
import { buildGutenbergPdfGalleryContent } from './editors/gutenberg-pdf-gallery';
import { buildElementorPdfGalleryData } from './editors/elementor-pdf-gallery';

/**
 * PDF is a "synthetic" source — it doesn't live in sources.json because there's
 * no public URL: the test PDF is uploaded into WP at setup time and its
 * resulting attachment URL is captured into seed/fixtures/.sample-pdf-url.
 * Skip the PDF variants if that file is absent (typically because the user
 * ran the seed without first running setup-wp.sh).
 */
const PDF_URL_FILE = join(__dirname, 'fixtures', '.sample-pdf-url');
function readPdfUrl(): string | null {
  if (!existsSync(PDF_URL_FILE)) return null;
  const url = readFileSync(PDF_URL_FILE, 'utf8').trim();
  return url || null;
}

// Start well above any WP system-post range. Bumped from 1000 → 10000 →
// 100000 → 500000 as WordPress kept creating attachments/revisions that
// collided with seed IDs (the PDF fixture upload landed at 100198, revisions
// at 100199+). 500000 gives ample headroom — normal admin activity would need
// to create ~400k posts to reach this range.
const SEED_ID_START = 500000;
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

  // PDF — the synthetic source seeded from the WP-uploaded fixture. Variant
  // attrs map to the embedpress-pdf block / embedpress_pdf widget controls.
  'PDF': [
    { suffix: '',             gutenbergAttrs: {}, elementorSettings: {} },
    {
      suffix: '-no-download',
      gutenbergAttrs:    { download: false },
      // Elementor PDF widget uses `pdf_print_download` (SWITCHER) — empty
      // string disables the download button.
      elementorSettings: { pdf_print_download: '' },
    },
    {
      suffix: '-flipbook',
      // `viewerStyle: 'flip-book'` switches the Gutenberg block to the 3D
      // flip-book renderer (flipbookRenderer URL) instead of the standard
      // PDF.js viewer. Elementor uses the `embedpress_pdf_viewer_style`
      // SELECT control with the same value.
      gutenbergAttrs:    { viewerStyle: 'flip-book' },
      elementorSettings: { embedpress_pdf_viewer_style: 'flip-book' },
    },
  ],

  // PDF Gallery — synthetic source reusing the same uploaded PDF.
  // Tests cover the three UI layouts (grid/masonry/carousel) plus a controls
  // variant that disables viewer toolbar and download to assert the
  // base64 viewer-params payload. Carousel is Pro-gated; the PHP renderer
  // silently falls back to 'grid' when Pro is absent.
  //
  // Gutenberg: the block crashes on insert (wrapFiltered bug — see
  // tests/gutenberg/editor-insert/pdf-gallery-editor-insert.spec.ts).
  // Gutenberg pages are still seeded (using the shortcode builder as a
  // working workaround) but Gutenberg front-end specs are skipped for now.
  'PDF Gallery': [
    {
      suffix: '',
      gutenbergAttrs: {},
      elementorSettings: {},
    },
    {
      suffix: '-masonry',
      gutenbergAttrs: {},
      elementorSettings: { layout: 'masonry' },
    },
    {
      // carousel and bookshelf layouts are Pro-gated — PHP falls back to
      // 'grid' when EMBEDPRESS_SL_ITEM_SLUG is not defined. The spec
      // handles the fallback via a Pro-active check.
      suffix: '-carousel',
      gutenbergAttrs: {},
      elementorSettings: {
        layout: 'carousel',
        carousel_arrows: 'yes',
        carousel_dots: 'yes',
        carousel_loop: 'yes',
      },
    },
    {
      // Controls variant: toolbar and download disabled (Pro-gated), plus
      // presentation mode disabled. Tests decode data-viewer-params and
      // assert the expected boolean values.
      suffix: '-controls',
      gutenbergAttrs: {},
      elementorSettings: {
        layout: 'grid',
        columns: '2',
        pdf_toolbar: '',
        download: '',
        presentation: '',
      },
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
  // Route each synthetic source to its own block builder. PDF Gallery uses a
  // wp:shortcode wrapper (embedpress_pdf_gallery shortcode) so the PHP resolver
  // renders it on the front-end without needing a pre-baked save() output.
  let content: string;
  if (source.source === 'PDF') {
    content = buildGutenbergPdfContent(source.url!, variant.gutenbergAttrs);
  } else if (source.source === 'PDF Gallery') {
    content = buildGutenbergPdfGalleryContent(source.url!);
  } else {
    content = buildGutenbergContent(source.url!, variant.gutenbergAttrs);
  }
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
  // Each synthetic source uses a dedicated widget builder. PDF Gallery uses the
  // `embedpress_pdf_gallery` Elementor widget with a pdf_items_json payload.
  let elementorData: string;
  if (source.source === 'PDF') {
    elementorData = buildElementorPdfData(source.url!, variant.elementorSettings);
  } else if (source.source === 'PDF Gallery') {
    elementorData = buildElementorPdfGalleryData(source.url!, variant.elementorSettings);
  } else {
    elementorData = buildElementorData(source.url!, source.source, variant.elementorSettings);
  }
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

  // Inject the synthetic "PDF" source if the fixture has been uploaded.
  // Without the URL file, skip silently — the seed still works for every
  // other source; only PDF specs will fail to find their seeded pages.
  const pdfUrl = readPdfUrl();
  if (pdfUrl) {
    all.push({ source: 'PDF', url: pdfUrl });
    // PDF Gallery reuses the same uploaded PDF as its first (and only) item.
    all.push({ source: 'PDF Gallery', url: pdfUrl });
  } else {
    process.stderr.write(
      `note: ${PDF_URL_FILE} not found — PDF and PDF Gallery variants skipped. Run \`npm run setup\` to upload the fixture first.\n`,
    );
  }

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

  // Iterate over the FULL source list to keep IDs stable regardless of
  // --source / --editor filters. Each source always occupies the same ID
  // slots (gutenberg slot, then elementor slot) whether or not it is being
  // emitted this run — so a partial re-seed never collides with existing pages.
  const emitSet = new Set(filtered.map((s) => s.source));
  let nextId = SEED_ID_START;
  for (const s of all) {
    for (const v of getVariants(s.source)) {
      const emit = emitSet.has(s.source);
      if (emit && editors.includes('gutenberg')) out.push(emitGutenberg(nextId, s, v));
      nextId++; // gutenberg slot — always advance
      if (emit && editors.includes('elementor')) out.push(emitElementor(nextId, s, v));
      nextId++; // elementor slot — always advance
    }
  }

  process.stdout.write(out.join('\n') + '\n');
  process.stderr.write(`✓ Generated ${targets.length} page(s) for ${filtered.length} source(s)\n`);
}

main();
