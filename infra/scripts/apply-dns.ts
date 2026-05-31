/**
 * apply-dns.ts — reads CDK stack outputs and creates/updates the corresponding
 * DNS records (DKIM CNAMEs, MAIL FROM MX + SPF, DMARC) in Cloudflare.
 *
 * The Cloudflare API token is read from AWS Secrets Manager via the AWS CLI
 * (`aws secretsmanager get-secret-value`) rather than the JS SDK. This is a
 * deliberate choice: the CLI already holds the active `aws login` browser session,
 * so we avoid SDK credential-resolution differences with that login flow. The only
 * credential needed on any machine therefore stays the IAM user's password + MFA.
 *
 * Usage:
 *   AWS_PROFILE=rajko CLOUDFLARE_ZONE_ID=<id> npm run apply-dns
 *   npm run apply-dns -- --profile rajko --dry-run
 *   npm run apply-dns -- --outputs=cdk-outputs.json
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const STACK_NAME = 'RajkoEmailStack';
const SECRET_ID = 'rajko/cloudflare-api-token';
const CF_API = 'https://api.cloudflare.com/client/v4';

type RecordType = 'CNAME' | 'MX' | 'TXT';

interface DnsRecord {
  type: RecordType;
  name: string; // fully-qualified record name
  content: string;
  priority?: number; // MX only
  comment?: string;
}

interface CliArgs {
  profile?: string;
  outputsPath: string;
  dryRun: boolean;
  overwriteDmarc: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const dryRun = argv.includes('--dry-run');
  const overwriteDmarc = argv.includes('--overwrite-dmarc');

  let profile: string | undefined;
  const profileEq = argv.find((a) => a.startsWith('--profile='));
  if (profileEq) profile = profileEq.split('=')[1];
  const profileIdx = argv.indexOf('--profile');
  if (profileIdx !== -1 && argv[profileIdx + 1]) profile = argv[profileIdx + 1];

  const outputsEq = argv.find((a) => a.startsWith('--outputs='));
  const outputsPath = resolve(outputsEq ? outputsEq.split('=')[1] : 'cdk-outputs.json');

  return { profile, outputsPath, dryRun, overwriteDmarc };
}

/**
 * Defense in depth: this project must never disturb the apex MX/SPF that Cloudflare
 * Email Routing uses to deliver contact@rajkoradivojac.com to the owner's Gmail. Our
 * records only ever target subdomains, but assert it explicitly so a future edit can't
 * silently clobber inbound mail.
 */
function assertNoApexMailRecords(records: DnsRecord[], apex: string): void {
  for (const rec of records) {
    const isApex = rec.name === apex;
    if (isApex && rec.type === 'MX') {
      throw new Error(
        `Refusing to write an apex MX record (${rec.name}). That would break ` +
          `Cloudflare Email Routing for contact@${apex}. SES uses the mail.${apex} subdomain.`,
      );
    }
    if (isApex && rec.type === 'TXT' && /^v=spf1/i.test(rec.content)) {
      throw new Error(
        `Refusing to write an apex SPF record (${rec.name}). That would break ` +
          `Cloudflare Email Routing's SPF for contact@${apex}.`,
      );
    }
  }
}

function getOutputs(path: string): Record<string, string> {
  let raw: Record<string, Record<string, string>>;
  try {
    raw = JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    throw new Error(
      `Could not read CDK outputs at ${path}. Run \`npm run deploy\` first ` +
        `(it writes cdk-outputs.json). Underlying error: ${(e as Error).message}`,
    );
  }
  const outputs = raw[STACK_NAME];
  if (!outputs) {
    throw new Error(`No outputs for stack "${STACK_NAME}" found in ${path}.`);
  }
  return outputs;
}

function getCloudflareToken(profile?: string): string {
  const args = [
    'secretsmanager',
    'get-secret-value',
    '--secret-id',
    SECRET_ID,
    '--query',
    'SecretString',
    '--output',
    'text',
  ];
  if (profile) args.push('--profile', profile);
  try {
    return execFileSync('aws', args, { encoding: 'utf8' }).trim();
  } catch (e) {
    throw new Error(
      `Failed to read ${SECRET_ID} from Secrets Manager via the AWS CLI. ` +
        `Is your \`aws login\` session active? Underlying error: ${(e as Error).message}`,
    );
  }
}

function buildRecords(o: Record<string, string>, domain: string): DnsRecord[] {
  const mailFrom = o.MailFromDomain;
  return [
    { type: 'CNAME', name: o.DkimToken1Name, content: o.DkimToken1Value, comment: 'SES Easy DKIM' },
    { type: 'CNAME', name: o.DkimToken2Name, content: o.DkimToken2Value, comment: 'SES Easy DKIM' },
    { type: 'CNAME', name: o.DkimToken3Name, content: o.DkimToken3Value, comment: 'SES Easy DKIM' },
    {
      type: 'MX',
      name: mailFrom,
      content: o.MailFromMxValue,
      priority: 10,
      comment: 'SES custom MAIL FROM',
    },
    {
      type: 'TXT',
      name: mailFrom,
      content: o.MailFromSpfValue ?? 'v=spf1 include:amazonses.com ~all',
      comment: 'SES MAIL FROM SPF',
    },
    {
      type: 'TXT',
      name: `_dmarc.${domain}`,
      content: `v=DMARC1; p=none; rua=mailto:dmarc@${domain}`,
      comment: 'DMARC monitoring (start at p=none)',
    },
  ];
}

interface CfResponse {
  success: boolean;
  errors?: unknown;
  result?: Array<{ id: string }> | { id: string };
}

async function cf(token: string, path: string, init?: RequestInit): Promise<CfResponse> {
  const res = await fetch(`${CF_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  const json = (await res.json()) as CfResponse;
  if (!json.success) {
    throw new Error(`Cloudflare API error on ${path}: ${JSON.stringify(json.errors)}`);
  }
  return json;
}

async function upsertRecord(
  token: string,
  zoneId: string,
  rec: DnsRecord,
  dryRun: boolean,
  overwriteDmarc: boolean,
): Promise<void> {
  const list = await cf(
    token,
    `/zones/${zoneId}/dns_records?type=${rec.type}&name=${encodeURIComponent(rec.name)}`,
  );
  const results = Array.isArray(list.result) ? list.result : [];
  const existing = results[0];

  // Don't silently clobber a pre-existing DMARC record (Email Routing may have set one).
  const isDmarc = rec.type === 'TXT' && rec.name.startsWith('_dmarc.');
  if (existing && isDmarc && !overwriteDmarc) {
    console.warn(
      `SKIP ${rec.type} ${rec.name}: a DMARC record already exists. ` +
        `Re-run with --overwrite-dmarc to replace it.`,
    );
    return;
  }

  const body: Record<string, unknown> = {
    type: rec.type,
    name: rec.name,
    content: rec.content,
    ttl: 1, // automatic
    comment: rec.comment,
  };
  if (rec.type === 'MX') body.priority = rec.priority ?? 10;
  if (rec.type === 'CNAME') body.proxied = false;

  if (dryRun) {
    console.log(
      `[dry-run] ${existing ? 'UPDATE' : 'CREATE'} ${rec.type} ${rec.name} -> ${rec.content}`,
    );
    return;
  }

  if (existing) {
    await cf(token, `/zones/${zoneId}/dns_records/${existing.id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    console.log(`UPDATED ${rec.type} ${rec.name}`);
  } else {
    await cf(token, `/zones/${zoneId}/dns_records`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    console.log(`CREATED ${rec.type} ${rec.name}`);
  }
}

async function main(): Promise<void> {
  const { profile, outputsPath, dryRun, overwriteDmarc } = parseArgs(process.argv.slice(2));

  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  if (!zoneId) {
    throw new Error(
      'Set CLOUDFLARE_ZONE_ID (the Cloudflare zone id for rajkoradivojac.com). ' +
        'Find it on the zone Overview page in the Cloudflare dashboard.',
    );
  }

  const outputs = getOutputs(outputsPath);
  const domain = outputs.DomainName;
  const records = buildRecords(outputs, domain);
  assertNoApexMailRecords(records, domain);
  const token = getCloudflareToken(profile);

  console.log(
    `Applying ${records.length} DNS records to zone ${zoneId}${dryRun ? ' (dry run)' : ''}...`,
  );
  for (const rec of records) {
    await upsertRecord(token, zoneId, rec, dryRun, overwriteDmarc);
  }
  console.log('Done.');
}

main().catch((e: unknown) => {
  console.error((e as Error).message ?? e);
  process.exit(1);
});
