import sourcesData from '../sources.json';

export type Editor = 'gutenberg' | 'elementor';

export interface Source {
  source: string;
  url: string | null;
}

export function getSources(): Source[] {
  return sourcesData as Source[];
}

export function getSourceByName(name: string): Source | undefined {
  return getSources().find(
    (s) => s.source.toLowerCase() === name.toLowerCase(),
  );
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function pageSlug(editor: Editor, sourceName: string): string {
  return `ep-${editor}-${slugify(sourceName)}`;
}

export function pageTitle(editor: Editor, sourceName: string): string {
  const label = editor === 'gutenberg' ? 'Gutenberg' : 'Elementor';
  return `EP ${label} — ${sourceName}`;
}
