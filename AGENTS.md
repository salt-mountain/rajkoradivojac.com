# rajkoradivojac.com

Author site at https://rajkoradivojac.com: Astro 7 and Tailwind 4 on Cloudflare
Pages, with Pages Functions for a double-opt-in newsletter and book excerpt
emails. Email goes out through AWS SES, which the CDK app in `infra/` sets up.
This repo is public.

## Layout

- `src/`: the site. `src/data/books.ts` is the source of truth for the books;
  `src/data/{clips,photos,videos}.ts` feed the media section
- `functions/`: Pages Functions. `api/` has subscribe, confirm, unsubscribe and
  resubscribe, `api/sns/ses-events.ts` takes SES bounce and complaint events,
  and `admin/` plus `api/admin/` are the subscriber dashboard and API
- `migrations/`: D1 schema and seed SQL (`wrangler.toml` binds the database as `DB`)
- `infra/`: CDK app for the SES identity, configuration set, SNS topics and the
  sender IAM user, plus the Cloudflare DNS scripts. It has its own
  `package.json` and `bun.lock`
- `scripts/`: `sync-books.ts` (books.ts to D1) and `upload-excerpts.ts` (PDFs to R2)
- `tests/`: Vitest unit tests for `functions/_lib`

## Commands

- `bun install`, and `bun install` in `infra/`, then `bun run dev`
- Before committing, run what CI runs:
  `bun run typecheck:functions && bun run typecheck:infra && bun run synth:infra`
  then `bun run format:check && bun run check && bun run build && bun run test`.
  `synth:infra` is offline and needs no AWS credentials.

## Deploys

Merging to `main` deploys the site and its Functions to Cloudflare Pages from CI
(`.github/workflows/ci.yml`), and only after `verify` passes. Nothing else
deploys the site.

Everything else that changes something outside the repo is done by the user,
by hand. Follow the "Sensitive work" rule below and hand over the command for:

- `infra/`: `cdk deploy`, `cdk bootstrap`, `cdk diff` (`bun run deploy`,
  `bun run diff`), `apply-dns`, `audit-dns` (it reads the Cloudflare token
  from AWS Secrets Manager) and `scripts/create-access-key.sh`
- Cloudflare: `wrangler pages secret`, anything with `--remote` (D1 migrations,
  `d1 execute`, `scripts/sync-books.ts --remote`) and R2 uploads
  (`scripts/upload-excerpts.ts`)
- Any `aws` CLI command

## Ask before changing

- **Migrations:** never edit a file in `migrations/`; add a new numbered one.
  Wrangler tracks applied migrations by file name.
- **Subscriber privacy:** `functions/api/subscribe.ts` returns the same response
  for every request so nobody can find out who is subscribed. Keep it that way.
  Never print, export or commit real subscriber data.
- **Email compliance:** the unsubscribe links and `List-Unsubscribe` headers
  (`functions/_lib/email.ts`, `templates.ts`), and `MAILING_ADDRESS` in
  `wrangler.toml`, which must be a real postal address before broadcasts start.
- **Access control:** `functions/_lib/admin-auth.ts`, which every admin route
  calls, and the sender user's IAM policy in `infra/lib/email-stack.ts`, which
  only allows sending through the verified identity and configuration set.
- **Site content:** what the site says about the author and his books
  (`src/data/`, `src/components/`). Typo fixes are fine.
- **Local-only folders:** `ops/` (private runbooks), `to-use/` and
  `excerpts-src/` are gitignored. Never commit them or copy their contents into
  the repo.

## Rules (same in every salt-mountain repo)

- **Ask, don't assume.** Don't act on anything the user hasn't explicitly
  approved, and don't state anything you haven't verified in the code, docs or
  command output. If unsure, say what you checked and ask.
- **Identity:** commit only as
  `salt-mountain <48201364+salt-mountain@users.noreply.github.com>` (check
  `git config user.email` first). No `Co-authored-by` or "Generated with" lines
  naming anyone else, AI tools included. Commits and tags are signed
  automatically by the user's git config. Never turn signing off
  (`--no-gpg-sign`, `-c commit.gpgsign=false`) or change signing settings; if
  signing fails, stop and tell the user.
- **Secrets:** never read, print, stage or commit secret files (`.env*` except
  `*.example`, `.dev.vars`, `*.pem` and other keys, `cdk-outputs.json`,
  credentials) or credential values from the environment. Check
  `git diff --cached --name-only` before every commit. If a secret was
  committed, stop and tell the user: it needs rotating, not a follow-up commit.
- **Sensitive work: hand the user the command.** For anything involving secrets
  or the repo's scripts, default to giving the user the exact commands to run;
  run them yourself only when the user says so. Pass secrets through environment
  variables the user sets, never as values in a command, a file or the chat:
  - The user sets one without it showing on screen or in shell history:
    `read -rs CLOUDFLARE_API_TOKEN && export CLOUDFLARE_API_TOKEN`
  - Commands then use the name (`$CLOUDFLARE_API_TOKEN`), or a tool's own prompt
    (`wrangler secret put NAME`).
  - Never ask the user to paste a secret into the chat, and never echo, log or
    write a variable's value.
  - Keep commands short, one per line: long pasted lines can wrap and break.
- **Deploys and other outside changes:** normally only CI deploys, on merge to
  `main`. Anything that deploys, publishes, or changes cloud resources, DNS or
  secrets (`wrangler … deploy`, `wrangler … secret`, `cdk deploy`,
  `docker push`, the repo's scripts) runs only after the user approves that
  specific command.
- **Git:** conventional commits (`feat:`, `fix:`, `test:`, `docs:`, `chore:`,
  `ci:`); short, descriptive branch names (`feat/blog-rss`). Ask before every
  `git push`. You may open the PR once the push is approved. Merge, tag or
  release only when told to (you may ask).
- **PR descriptions:** three short parts: the problem, the solution, and
  anything a reviewer needs to know about this change (risks, required
  follow-ups). Every sentence must be about this PR's change: leave out other
  planned work, work in other areas, and anything that isn't needed to review
  or act on this PR. Verification details belong in the chat, not the PR.
- **Tests:** add or update tests for any page or behaviour you change, in the
  same PR.
- **Comments and naming:** comment only when the code can't say it: why
  something is done, a constraint, a workaround, or a link to the source.
  Comment blocks are <= 7 words, function names <= 4 words. User-facing message
  strings should be <= 10 words. Use an active voice, no stage performances,
  and pick the most common word when choosing among alternatives. Don't restate
  the code, narrate steps ("Now we…", "This function…"), add banners or section
  headers, use emphasis words (IMPORTANT, CRITICAL, NOTE:), or mention the
  change or conversation ("added", "fixed", "per request"). Leave existing
  comments alone unless you're changing that code.
- **Dependencies:** Dependabot and Renovate handle upgrades. Bump a version by
  hand (for example, to skip a cooldown) only if the user approves. A new
  package needs a reason in the PR and an exact version (`bun add --exact`),
  with `bun.lock` committed. Bun's pins (`packageManager`, `.bun-version`) only
  move together.
