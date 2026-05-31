import type { Env } from '../../_lib/types';
import { verifySnsMessage, isAwsSnsUrl, type SnsMessage } from '../../_lib/sns';
import { insertSesEvent, suppressEmail } from '../../_lib/db';

// Only act on events from our own SES topics.
function isOurTopic(arn: string): boolean {
  return arn.endsWith(':ses-bounces') || arn.endsWith(':ses-complaints');
}

interface SesEvent {
  eventType?: string;
  notificationType?: string;
  mail?: { messageId?: string; destination?: string[] };
  bounce?: {
    bounceType?: string;
    bounceSubType?: string;
    bouncedRecipients?: Array<{ emailAddress?: string }>;
  };
  complaint?: {
    complaintFeedbackType?: string;
    complainedRecipients?: Array<{ emailAddress?: string }>;
  };
  reject?: { reason?: string };
}

function parseEvent(ev: SesEvent): {
  type: string;
  emails: string[];
  reason: string | null;
  suppress: boolean;
} {
  const type = ev.eventType ?? ev.notificationType ?? 'Unknown';
  if (type === 'Bounce') {
    const b = ev.bounce ?? {};
    return {
      type: 'Bounce',
      emails: (b.bouncedRecipients ?? []).map((r) => r.emailAddress ?? '').filter(Boolean),
      reason: `${b.bounceType ?? ''}/${b.bounceSubType ?? ''}`,
      suppress: b.bounceType === 'Permanent', // hard bounce only
    };
  }
  if (type === 'Complaint') {
    const c = ev.complaint ?? {};
    return {
      type: 'Complaint',
      emails: (c.complainedRecipients ?? []).map((r) => r.emailAddress ?? '').filter(Boolean),
      reason: c.complaintFeedbackType ?? 'complaint',
      suppress: true,
    };
  }
  if (type === 'Reject') {
    return { type, emails: ev.mail?.destination ?? [], reason: ev.reject?.reason ?? null, suppress: false };
  }
  return { type, emails: ev.mail?.destination ?? [], reason: null, suppress: false };
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let msg: SnsMessage;
  try {
    msg = JSON.parse(await request.text());
  } catch {
    return new Response('bad request', { status: 400 });
  }

  if (!isOurTopic(msg.TopicArn ?? '')) return new Response('wrong topic', { status: 403 });
  if (!(await verifySnsMessage(msg))) return new Response('invalid signature', { status: 403 });

  if (msg.Type === 'SubscriptionConfirmation') {
    // Confirm the subscription by visiting the (validated) SubscribeURL.
    if (msg.SubscribeURL && isAwsSnsUrl(msg.SubscribeURL)) {
      await fetch(msg.SubscribeURL);
    }
    return new Response('ok');
  }

  if (msg.Type === 'Notification') {
    let ev: SesEvent;
    try {
      ev = JSON.parse(msg.Message);
    } catch {
      return new Response('ok'); // not JSON we understand; ack so SNS doesn't retry
    }
    const { type, emails, reason, suppress } = parseEvent(ev);
    const messageId = ev.mail?.messageId ?? null;
    for (const email of emails) {
      await insertSesEvent(env, { eventType: type, email, messageId, reason, raw: msg.Message });
      if (suppress) await suppressEmail(env, email);
    }
    return new Response('ok');
  }

  return new Response('ok');
};
