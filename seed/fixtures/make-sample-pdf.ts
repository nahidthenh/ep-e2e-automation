/**
 * Generates a minimal valid PDF at `seed/fixtures/sample.pdf` if absent.
 * Hand-rolled (no PDF library) so the harness has no extra runtime dep —
 * the result is ~600 bytes of pure ASCII that opens in any viewer.
 *
 * Run via: `npx tsx seed/fixtures/make-sample-pdf.ts`
 *
 * If you'd rather use a real PDF for testing, drop your own `sample.pdf`
 * into this directory and this script will leave it alone.
 */

import { existsSync, writeFileSync, statSync } from 'fs';
import { join } from 'path';

const OUT_PATH = join(__dirname, 'sample.pdf');

function buildMinimalPdf(): string {
  const objects = [
    '<</Type/Catalog/Pages 2 0 R>>',
    '<</Type/Pages/Kids[3 0 R]/Count 1>>',
    '<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]'
      + '/Resources<</Font<</F1<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>>>>>'
      + '/Contents 4 0 R>>',
    '<</Length 67>>stream\n'
      + 'BT /F1 24 Tf 100 700 Td (EmbedPress E2E sample fixture) Tj ET\n'
      + 'endstream',
  ];

  const out: string[] = [];
  const offsets: number[] = [0]; // index 0 unused (free entry)

  out.push('%PDF-1.4\n');
  out.push('%\xE2\xE3\xCF\xD3\n'); // binary marker so tools detect it as binary

  for (let i = 0; i < objects.length; i++) {
    offsets.push(out.join('').length);
    out.push(`${i + 1} 0 obj ${objects[i]} endobj\n`);
  }

  const xrefStart = out.join('').length;
  out.push(`xref\n0 ${objects.length + 1}\n`);
  out.push('0000000000 65535 f \n');
  for (let i = 1; i <= objects.length; i++) {
    out.push(offsets[i].toString().padStart(10, '0') + ' 00000 n \n');
  }
  out.push(
    `trailer<</Size ${objects.length + 1}/Root 1 0 R>>\n`
      + `startxref\n${xrefStart}\n%%EOF\n`,
  );

  return out.join('');
}

function main() {
  if (existsSync(OUT_PATH)) {
    const size = statSync(OUT_PATH).size;
    process.stderr.write(`✓ ${OUT_PATH} already exists (${size} bytes) — leaving it alone.\n`);
    return;
  }
  const pdf = buildMinimalPdf();
  // 'binary' encoding preserves the PDF binary marker bytes (\xE2 etc.) byte-for-byte.
  writeFileSync(OUT_PATH, pdf, { encoding: 'binary' });
  process.stderr.write(`✓ wrote ${OUT_PATH} (${pdf.length} bytes)\n`);
}

main();
