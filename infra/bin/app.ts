#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { EmailStack } from '../lib/email-stack';

const app = new cdk.App();

const domainName = app.node.tryGetContext('domainName') ?? 'rajkoradivojac.com';
const mailFromSubdomain = app.node.tryGetContext('mailFromSubdomain') ?? 'mail';
const region =
  app.node.tryGetContext('region') ?? process.env.CDK_DEFAULT_REGION ?? 'us-east-1';
const account = process.env.CDK_DEFAULT_ACCOUNT;

new EmailStack(app, 'RajkoEmailStack', {
  // account is undefined during offline `cdk synth` (env-agnostic) and populated
  // from the active session during `cdk deploy`.
  env: { account, region },
  description:
    'SES domain identity, Easy DKIM, custom MAIL FROM, configuration set, ' +
    'SNS bounce/complaint topics, and a scoped sender IAM user for rajkoradivojac.com.',
  domainName,
  mailFromSubdomain,
  configurationSetName: 'rajko-mail',
});

app.synth();
