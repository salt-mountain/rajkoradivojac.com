# infra — AWS SES infrastructure (CDK)

CDK app that provisions the AWS-side email infrastructure for rajkoradivojac.com.

> Step-by-step account setup (IAM/`aws login`/Secrets Manager) and the SES
> production-access + DNS runbook are kept in local-only notes under `../ops/`
> (gitignored — not part of this public repo).

## What it creates (`lib/email-stack.ts`)

- **SES domain identity** for `rajkoradivojac.com` with **Easy DKIM (2048-bit)**.
- **Custom MAIL FROM** domain `mail.rajkoradivojac.com` (better deliverability).
- **Configuration set** `rajko-mail` — reputation metrics on, sending enabled,
  bounce/complaint suppression at the config-set level, TLS required.
- **SNS topics** `ses-bounces` and `ses-complaints`, wired via event destinations
  (BOUNCE/REJECT/DELIVERY → bounces, COMPLAINT → complaints).
- **IAM sender user** `RajkoEmailSender`, scoped to `ses:SendEmail`/`ses:SendRawEmail`
  on the verified identity + configuration set only. **No access key in CDK** — mint it
  once with `scripts/create-access-key.sh` and store it as a Wrangler secret.

The sender user is named with a `RajkoEmail` prefix on purpose: the `rajko-developer`
IAM user's inline policy grants IAM management only on `RajkoEmail*` resources.

## Prerequisites

- AWS CLI v2 (≥ 2.32.0) + an active `aws login` session (`AWS_PROFILE=rajko`).
- AWS CDK (`npm i -g aws-cdk`), Node.js LTS.
- `npm install` in this directory.

## Usage

```bash
npm install

# Validate locally (no AWS calls):
npm run synth

# One-time per account/region:
cdk bootstrap aws://<ACCOUNT_ID>/us-east-1

# Review, then deploy (writes cdk-outputs.json):
npm run diff
npm run deploy

# Create Cloudflare DNS records from the deploy outputs:
CLOUDFLARE_ZONE_ID=<zone-id> npm run apply-dns
#   add --dry-run to preview

# Mint the sender access key (once) and store as Wrangler secrets:
bash scripts/create-access-key.sh
```

## Config

Context values live in `cdk.json` (`domainName`, `mailFromSubdomain`, `region`,
`cloudflareZoneId`). The zone id is not a secret. The Cloudflare API token is **not**
here — it's in AWS Secrets Manager (`rajko/cloudflare-api-token`) and read by
`apply-dns.ts` via the AWS CLI at runtime.
