// Upload excerpt PDFs from excerpts-src/<slug>.pdf to R2 at excerpts/<slug>.pdf,
// using the R2 S3 API + R2_* credentials (no `r2` Wrangler scope needed).
//
// Provide credentials via the environment, e.g. by sourcing them from .dev.vars:
//   export $(grep -E '^R2_' .dev.vars | xargs) && bun run scripts/upload-excerpts.ts
// Filenames must be <slug>.pdf matching a book in src/data/books.ts.
import { AwsClient } from 'aws4fetch';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { books } from '../src/data/books';

const ACCOUNT = process.env.R2_ACCOUNT_ID;
const KEY = process.env.R2_ACCESS_KEY_ID;
const SECRET = process.env.R2_SECRET_ACCESS_KEY;
const BUCKET = 'rajko-excerpts';
const SRC = resolve('excerpts-src');

if (!ACCOUNT || !KEY || !SECRET) {
  console.error('Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY in the environment.');
  process.exit(1);
}

const bookBySlug = new Map(
  books.filter((b) => b.hasExcerpt && b.slug).map((b) => [b.slug as string, b]),
);

// Branded download filename, e.g. `How to Say No by Rajko Radivojac - Excerpt.pdf`.
// Sets both an ASCII-folded `filename=` fallback and an RFC 5987 UTF-8 `filename*=`
// so Serbian titles (č, –, …) survive in modern clients.
function contentDisposition(title: string): string {
  const display = `${title} by Rajko Radivojac - Excerpt.pdf`;
  const ascii = display
    .normalize('NFKD') // decompose accents so base letters survive the ASCII filter
    .replace(/[^\x20-\x7E]/g, '') // drop all non-ASCII (combining marks, dashes, …)
    .replace(/\s{2,}/g, ' ') // collapse gaps left by dropped characters
    .replace(/["\\]/g, '') // strip quotes/backslashes
    .trim();
  const encoded = encodeURIComponent(display);
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

const client = new AwsClient({
  accessKeyId: KEY,
  secretAccessKey: SECRET,
  service: 's3',
  region: 'auto',
});

const files = readdirSync(SRC).filter((f) => f.toLowerCase().endsWith('.pdf'));
if (files.length === 0) {
  console.error(`No PDFs found in ${SRC}/`);
  process.exit(1);
}

let uploaded = 0;
for (const file of files) {
  const slug = file.replace(/\.pdf$/i, '');
  const book = bookBySlug.get(slug);
  if (!book) {
    console.warn(`SKIP ${file}: "${slug}" is not a known excerpt slug — rename to <slug>.pdf.`);
    continue;
  }
  const body = readFileSync(resolve(SRC, file));
  const url = `https://${ACCOUNT}.r2.cloudflarestorage.com/${BUCKET}/excerpts/${slug}.pdf`;
  const res = await client.fetch(url, {
    method: 'PUT',
    body,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': contentDisposition(book.title),
    },
  });
  if (!res.ok) {
    console.error(`FAILED ${slug}: ${res.status} ${await res.text()}`);
    process.exit(1);
  }
  console.log(`UPLOADED excerpts/${slug}.pdf (${(body.length / 1024).toFixed(0)} KB)`);
  uploaded++;
}
console.log(`Done. ${uploaded} file(s) uploaded.`);
