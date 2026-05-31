/**
 * audit-dns.ts — READ-ONLY. Lists the current Cloudflare DNS records for the zone and
 * highlights anything relevant to email so we can confirm we won't disturb Cloudflare
 * Email Routing (contact@rajkoradivojac.com -> Gmail) before running apply-dns.
 *
 * Makes no changes. Usage:
 *   cd infra
 *   CLOUDFLARE_ZONE_ID=<zone-id> npm run audit-dns -- --profile rajko
 */
import { execFileSync } from 'node:child_process';

const SECRET_ID = 'rajko/cloudflare-api-token';
const CF_API = 'https://api.cloudflare.com/client/v4';
const APEX = 'rajkoradivojac.com';

interface CfDnsRecord {
  type: string;
  name: string;
  content: string;
  priority?: number;
  proxied?: boolean;
}

function getProfile(argv: string[]): string | undefined {
  const eq = argv.find((a) => a.startsWith('--profile='));
  if (eq) return eq.split('=')[1];
  const idx = argv.indexOf('--profile');
  if (idx !== -1 && argv[idx + 1]) return argv[idx + 1];
  return undefined;
}

function getCloudflareToken(profile?: string): string {
  const args = [
    'secretsmanager', 'get-secret-value',
    '--secret-id', SECRET_ID,
    '--query', 'SecretString', '--output', 'text',
  ];
  if (profile) args.push('--profile', profile);
  return execFileSync('aws', args, { encoding: 'utf8' }).trim();
}

async function listRecords(token: string, zoneId: string): Promise<CfDnsRecord[]> {
  const res = await fetch(`${CF_API}/zones/${zoneId}/dns_records?per_page=200`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = (await res.json()) as { success: boolean; errors?: unknown; result?: CfDnsRecord[] };
  if (!json.success) throw new Error(`Cloudflare API error: ${JSON.stringify(json.errors)}`);
  return json.result ?? [];
}

function fmt(r: CfDnsRecord): string {
  const prio = r.priority != null ? ` prio=${r.priority}` : '';
  const proxied = r.proxied != null ? ` proxied=${r.proxied}` : '';
  return `  ${r.type.padEnd(6)} ${r.name.padEnd(48)} ${r.content}${prio}${proxied}`;
}

async function main(): Promise<void> {
  const profile = getProfile(process.argv.slice(2));
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  if (!zoneId) throw new Error('Set CLOUDFLARE_ZONE_ID (zone id for rajkoradivojac.com).');

  const token = getCloudflareToken(profile);
  const records = await listRecords(token, zoneId);
  records.sort((a, b) => (a.type + a.name).localeCompare(b.type + b.name));

  console.log(`\n=== All DNS records (${records.length}) ===`);
  for (const r of records) console.log(fmt(r));

  const apexMx = records.filter((r) => r.type === 'MX' && r.name === APEX);
  const apexSpf = records.filter(
    (r) => r.type === 'TXT' && r.name === APEX && /v=spf1/i.test(r.content),
  );
  const dmarc = records.filter((r) => r.type === 'TXT' && r.name === `_dmarc.${APEX}`);
  const dkim = records.filter((r) => r.name.includes('._domainkey.'));
  const mailFrom = records.filter((r) => r.name === `mail.${APEX}`);

  console.log(`\n=== Email-relevant findings ===`);
  console.log(`Apex MX (Cloudflare Email Routing — MUST PRESERVE): ${apexMx.length || 'none'}`);
  apexMx.forEach((r) => console.log(fmt(r)));
  console.log(`Apex SPF (MUST PRESERVE): ${apexSpf.length || 'none'}`);
  apexSpf.forEach((r) => console.log(fmt(r)));
  console.log(`Existing _dmarc (apply-dns won't overwrite without --overwrite-dmarc): ${dmarc.length || 'none'}`);
  dmarc.forEach((r) => console.log(fmt(r)));
  console.log(`Existing DKIM (_domainkey): ${dkim.length || 'none'}`);
  dkim.forEach((r) => console.log(fmt(r)));
  console.log(`Existing mail.${APEX} records (SES MAIL FROM target): ${mailFrom.length || 'none'}`);
  mailFrom.forEach((r) => console.log(fmt(r)));
  console.log('');
}

main().catch((e: unknown) => {
  console.error((e as Error).message ?? e);
  process.exit(1);
});
