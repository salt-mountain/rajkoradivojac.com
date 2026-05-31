import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ses from 'aws-cdk-lib/aws-ses';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as iam from 'aws-cdk-lib/aws-iam';

export interface EmailStackProps extends cdk.StackProps {
  /** Apex domain to verify as a sending identity, e.g. `rajkoradivojac.com`. */
  readonly domainName: string;
  /** Subdomain label for the custom MAIL FROM, e.g. `mail` -> `mail.rajkoradivojac.com`. */
  readonly mailFromSubdomain: string;
  /** SES configuration set name, e.g. `rajko-mail`. */
  readonly configurationSetName: string;
}

/**
 * Provisions all AWS-side email infrastructure:
 *   - SES domain identity with Easy DKIM (2048-bit) + custom MAIL FROM
 *   - A configuration set with reputation metrics and bounce/complaint suppression
 *   - SNS topics for bounces and complaints, wired via event destinations
 *   - A narrowly-scoped IAM sender user (no access key — minted later by a script)
 *
 * The sender user's physical name is intentionally prefixed `RajkoEmail` so it falls
 * under the `RajkoEmail*` IAM grant on the `rajko-developer` user (see local ops/ notes).
 */
export class EmailStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: EmailStackProps) {
    super(scope, id, props);

    const { domainName, mailFromSubdomain, configurationSetName } = props;
    const mailFromDomain = `${mailFromSubdomain}.${domainName}`;

    // --- Configuration set -------------------------------------------------
    const configSet = new ses.ConfigurationSet(this, 'ConfigurationSet', {
      configurationSetName,
      reputationMetrics: true,
      sendingEnabled: true,
      // Account-level suppression is on by default; enable config-set-level too.
      suppressionReasons: ses.SuppressionReasons.BOUNCES_AND_COMPLAINTS,
      tlsPolicy: ses.ConfigurationSetTlsPolicy.REQUIRE,
    });

    // --- Domain identity: Easy DKIM (2048-bit) + custom MAIL FROM ----------
    const identity = new ses.EmailIdentity(this, 'DomainIdentity', {
      identity: ses.Identity.domain(domainName),
      dkimIdentity: ses.DkimIdentity.easyDkim(
        ses.EasyDkimSigningKeyLength.RSA_2048_BIT,
      ),
      dkimSigning: true,
      mailFromDomain,
      mailFromBehaviorOnMxFailure:
        ses.MailFromBehaviorOnMxFailure.USE_DEFAULT_VALUE,
      configurationSet: configSet,
    });

    // --- SNS topics for feedback ------------------------------------------
    const bouncesTopic = new sns.Topic(this, 'SesBouncesTopic', {
      topicName: 'ses-bounces',
      displayName: 'SES Bounces (rajkoradivojac.com)',
    });
    const complaintsTopic = new sns.Topic(this, 'SesComplaintsTopic', {
      topicName: 'ses-complaints',
      displayName: 'SES Complaints (rajkoradivojac.com)',
    });

    // --- Event destinations: route SES events to the SNS topics -----------
    // BOUNCE/REJECT/DELIVERY (delivery confirmations) -> bounces topic.
    new ses.ConfigurationSetEventDestination(this, 'BounceEventDestination', {
      configurationSet: configSet,
      configurationSetEventDestinationName: 'bounces-rejects-deliveries',
      destination: ses.EventDestination.snsTopic(bouncesTopic),
      events: [
        ses.EmailSendingEvent.BOUNCE,
        ses.EmailSendingEvent.REJECT,
        ses.EmailSendingEvent.DELIVERY,
      ],
    });
    // COMPLAINT -> complaints topic.
    new ses.ConfigurationSetEventDestination(this, 'ComplaintEventDestination', {
      configurationSet: configSet,
      configurationSetEventDestinationName: 'complaints',
      destination: ses.EventDestination.snsTopic(complaintsTopic),
      events: [ses.EmailSendingEvent.COMPLAINT],
    });

    // --- Scoped sender IAM user (no access key in CDK) --------------------
    const identityArn = this.formatArn({
      service: 'ses',
      resource: 'identity',
      resourceName: domainName,
    });
    const configSetArn = this.formatArn({
      service: 'ses',
      resource: 'configuration-set',
      resourceName: configurationSetName,
    });

    const senderUser = new iam.User(this, 'SenderUser', {
      userName: 'RajkoEmailSender',
    });
    senderUser.addToPrincipalPolicy(
      new iam.PolicyStatement({
        sid: 'SendScopedToIdentityAndConfigSet',
        effect: iam.Effect.ALLOW,
        actions: ['ses:SendEmail', 'ses:SendRawEmail'],
        resources: [identityArn, configSetArn],
      }),
    );

    // --- Outputs ----------------------------------------------------------
    const out = (id: string, value: string, description: string) =>
      new cdk.CfnOutput(this, id, { value, description });

    out('DkimToken1Name', identity.dkimDnsTokenName1, 'DKIM CNAME #1 host');
    out('DkimToken1Value', identity.dkimDnsTokenValue1, 'DKIM CNAME #1 target');
    out('DkimToken2Name', identity.dkimDnsTokenName2, 'DKIM CNAME #2 host');
    out('DkimToken2Value', identity.dkimDnsTokenValue2, 'DKIM CNAME #2 target');
    out('DkimToken3Name', identity.dkimDnsTokenName3, 'DKIM CNAME #3 host');
    out('DkimToken3Value', identity.dkimDnsTokenValue3, 'DKIM CNAME #3 target');
    out('DomainName', domainName, 'Verified sending domain');
    out('MailFromDomain', mailFromDomain, 'Custom MAIL FROM domain (needs MX + SPF)');
    out(
      'MailFromMxValue',
      `feedback-smtp.${this.region}.amazonses.com`,
      'MX target for the MAIL FROM domain (priority 10)',
    );
    out('MailFromSpfValue', 'v=spf1 include:amazonses.com ~all', 'SPF TXT for MAIL FROM');
    out('SesRegion', this.region, 'SES region');
    out('BouncesTopicArn', bouncesTopic.topicArn, 'SNS topic ARN for bounces');
    out('ComplaintsTopicArn', complaintsTopic.topicArn, 'SNS topic ARN for complaints');
    out('SenderUserArn', senderUser.userArn, 'IAM sender user ARN');
    out('SenderUserName', senderUser.userName, 'IAM sender user name');
    out('ConfigurationSetName', configSet.configurationSetName, 'SES configuration set');
  }
}
