// Sync the excerpt-eligible books from src/data/books.ts into the D1 `books` table,
// so books.ts is the single source of truth. Edit books.ts, then run this.
// Run with bun:
//   bun run scripts/sync-books.ts            # local D1
//   bun run scripts/sync-books.ts --remote   # production D1
import { execFileSync } from "node:child_process";
import { books } from "../src/data/books";

const remote = process.argv.includes("--remote");
const target = remote ? "--remote" : "--local";

const excerptBooks = books.filter((b) => b.hasExcerpt && b.slug);
if (excerptBooks.length === 0) {
  console.error("No excerpt books with slugs found in src/data/books.ts.");
  process.exit(1);
}

const esc = (s: string) => s.replace(/'/g, "''");

const values = excerptBooks
  .map(
    (b) =>
      `('${esc(b.slug!)}', '${esc(b.title)}', 'excerpts/${esc(b.slug!)}.pdf', 1)`,
  )
  .join(",\n  ");

// Upsert on slug: refresh title, keep the derived key, (re)activate. Note: books
// removed from books.ts are NOT deactivated here — do that deliberately if needed.
const sql = `INSERT INTO books (slug, title, excerpt_pdf_key, active) VALUES
  ${values}
ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  excerpt_pdf_key = excluded.excerpt_pdf_key,
  active = 1;`;

console.log(
  `Syncing ${excerptBooks.length} books to ${remote ? "REMOTE" : "local"} D1…`,
);
execFileSync(
  "wrangler",
  ["d1", "execute", "rajko-newsletter", target, "--command", sql],
  { stdio: "inherit" },
);
console.log("Done.");
