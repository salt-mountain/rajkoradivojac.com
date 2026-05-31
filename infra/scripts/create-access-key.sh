#!/usr/bin/env bash
#
# create-access-key.sh — mint a programmatic access key for the SES sender IAM user.
#
# Run ONCE, after `cdk deploy`. The access key is for the Cloudflare Worker (which
# can't do browser auth) and must live ONLY as a Wrangler secret — never on disk,
# never committed. We mint it via the CLI (not CDK) so it stays out of CDK/CFN state.
#
# Requires an active `aws login` session (AWS_PROFILE=rajko or pass --profile rajko).
#
# Usage:
#   AWS_PROFILE=rajko bash scripts/create-access-key.sh
#   bash scripts/create-access-key.sh --profile rajko
#
set -euo pipefail

USER_NAME="${SENDER_USER_NAME:-RajkoEmailSender}"
PAGES_PROJECT="${PAGES_PROJECT:-rajkoradivojac-com}"

echo "Minting a programmatic access key for IAM user: ${USER_NAME}"
echo "(For the Cloudflare Worker's SES sending only.)"
echo

# Any extra args (e.g. --profile rajko) are passed straight through to the aws call.
aws iam create-access-key --user-name "${USER_NAME}" --output table "$@"

cat <<EOF

The SecretAccessKey above is shown ONCE. Do this now:

  1. Copy both AccessKeyId and SecretAccessKey into your password manager.

  2. Install them as Cloudflare Pages secrets (you'll be prompted to paste each):

       wrangler pages secret put AWS_ACCESS_KEY_ID --project-name ${PAGES_PROJECT}
       wrangler pages secret put AWS_SECRET_ACCESS_KEY --project-name ${PAGES_PROJECT}

  3. Do NOT write these to a file, .env, or commit them.

If a key already exists and you need a fresh one, delete the old one first:
  aws iam list-access-keys --user-name ${USER_NAME}
  aws iam delete-access-key --user-name ${USER_NAME} --access-key-id <OLD_ID>
EOF
