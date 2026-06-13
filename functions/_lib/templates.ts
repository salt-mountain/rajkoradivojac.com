// Email templates. Each returns { subject, html, text }. Phase 1 ships the
// confirmation (double opt-in) template; resubscribe / excerpt / broadcast follow
// in later phases.

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function layout(opts: {
  fromName: string;
  bodyHtml: string;
  unsubscribeUrl: string;
  mailingAddress: string;
}): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 0;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:8px;overflow:hidden;">
          <tr><td style="padding:32px 40px;">
            ${opts.bodyHtml}
          </td></tr>
          <tr><td style="padding:20px 40px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;line-height:1.6;">
            You received this email because it was requested at rajkoradivojac.com.<br>
            <a href="${opts.unsubscribeUrl}" style="color:#6b7280;">Unsubscribe</a>${
              opts.mailingAddress.trim()
                ? ` &nbsp;&middot;&nbsp; ${escapeHtml(opts.mailingAddress)}`
                : ""
            }
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

export function confirmationEmail(opts: {
  fromName: string;
  bookTitle: string | null;
  confirmUrl: string;
  unsubscribeUrl: string;
  mailingAddress: string;
}): RenderedEmail {
  const { fromName, bookTitle, confirmUrl, unsubscribeUrl, mailingAddress } =
    opts;

  const subject = bookTitle
    ? `Confirm your email to receive the excerpt of ${bookTitle}`
    : `Confirm your subscription to ${fromName}'s newsletter`;

  const lead = bookTitle
    ? `Thanks for your interest in <strong>${escapeHtml(bookTitle)}</strong>. Confirm your email below and we'll send your free excerpt right away.`
    : `Thanks for subscribing to ${escapeHtml(fromName)}'s newsletter. Please confirm your email to start receiving updates.`;

  const bodyHtml = `
    <h1 style="margin:0 0 16px;font-size:22px;color:#0f172a;">Confirm your email</h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;">${lead}</p>
    <p style="margin:0 0 28px;">
      <a href="${confirmUrl}" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 24px;border-radius:6px;">Confirm my email</a>
    </p>
    <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <a href="${confirmUrl}" style="color:#0f766e;word-break:break-all;">${confirmUrl}</a>
    </p>
    <p style="margin:20px 0 0;font-size:13px;color:#6b7280;">
      This link expires in 7 days. If you didn't request this, you can ignore this email.
    </p>`;

  const text = [
    `Confirm your email`,
    ``,
    bookTitle
      ? `Thanks for your interest in "${bookTitle}". Confirm your email to receive your free excerpt:`
      : `Thanks for subscribing to ${fromName}'s newsletter. Confirm your email to start receiving updates:`,
    ``,
    confirmUrl,
    ``,
    `This link expires in 7 days. If you didn't request this, you can ignore this email.`,
    ``,
    `Unsubscribe: ${unsubscribeUrl}`,
    ...(mailingAddress.trim() ? [mailingAddress] : []),
  ].join("\n");

  return {
    subject,
    html: layout({ fromName, bodyHtml, unsubscribeUrl, mailingAddress }),
    text,
  };
}

export function resubscribeEmail(opts: {
  fromName: string;
  bookTitle: string | null;
  resubscribeUrl: string;
  unsubscribeUrl: string;
  mailingAddress: string;
}): RenderedEmail {
  const {
    fromName,
    bookTitle,
    resubscribeUrl,
    unsubscribeUrl,
    mailingAddress,
  } = opts;

  const subject = bookTitle
    ? `Welcome back — confirm to receive the excerpt of ${bookTitle}`
    : `Welcome back — confirm to resubscribe`;

  const lead = bookTitle
    ? `You'd previously unsubscribed, so we won't add you back automatically. Confirm below to re-subscribe and we'll send your free excerpt of <strong>${escapeHtml(bookTitle)}</strong>.`
    : `You'd previously unsubscribed, so we won't add you back automatically. Confirm below to start receiving ${escapeHtml(fromName)}'s emails again.`;

  const bodyHtml = `
    <h1 style="margin:0 0 16px;font-size:22px;color:#0f172a;">Welcome back</h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;">${lead}</p>
    <p style="margin:0 0 28px;">
      <a href="${resubscribeUrl}" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 24px;border-radius:6px;">Confirm &amp; resubscribe</a>
    </p>
    <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <a href="${resubscribeUrl}" style="color:#0f766e;word-break:break-all;">${resubscribeUrl}</a>
    </p>
    <p style="margin:20px 0 0;font-size:13px;color:#6b7280;">
      This link expires in 7 days. If you didn't request this, you can ignore this email and
      you'll stay unsubscribed.
    </p>`;

  const text = [
    `Welcome back`,
    ``,
    bookTitle
      ? `You'd previously unsubscribed. Confirm to re-subscribe and receive your free excerpt of "${bookTitle}":`
      : `You'd previously unsubscribed. Confirm to start receiving ${fromName}'s emails again:`,
    ``,
    resubscribeUrl,
    ``,
    `This link expires in 7 days. If you didn't request this, ignore this email and you'll stay unsubscribed.`,
    ``,
    `Unsubscribe: ${unsubscribeUrl}`,
    ...(mailingAddress.trim() ? [mailingAddress] : []),
  ].join("\n");

  return {
    subject,
    html: layout({ fromName, bodyHtml, unsubscribeUrl, mailingAddress }),
    text,
  };
}

export function excerptEmail(opts: {
  fromName: string;
  bookTitle: string;
  downloadUrl: string;
  unsubscribeUrl: string;
  mailingAddress: string;
}): RenderedEmail {
  const { fromName, bookTitle, downloadUrl, unsubscribeUrl, mailingAddress } =
    opts;

  const subject = `Your excerpt of ${bookTitle} is ready`;

  const bodyHtml = `
    <h1 style="margin:0 0 16px;font-size:22px;color:#0f172a;">Your excerpt is ready</h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;">
      Thanks for confirming! Here's your free excerpt of <strong>${escapeHtml(bookTitle)}</strong>.
    </p>
    <p style="margin:0 0 28px;">
      <a href="${downloadUrl}" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 24px;border-radius:6px;">Download the excerpt (PDF)</a>
    </p>
    <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <a href="${downloadUrl}" style="color:#0f766e;word-break:break-all;">${downloadUrl}</a>
    </p>
    <p style="margin:20px 0 0;font-size:13px;color:#6b7280;">
      This download link expires in 7 days. Enjoy the read, and watch your inbox for news
      on new releases.
    </p>`;

  const text = [
    `Your excerpt of ${bookTitle} is ready`,
    ``,
    `Thanks for confirming! Download your free excerpt of "${bookTitle}" here:`,
    ``,
    downloadUrl,
    ``,
    `This download link expires in 7 days.`,
    ``,
    `Unsubscribe: ${unsubscribeUrl}`,
    ...(mailingAddress.trim() ? [mailingAddress] : []),
  ].join("\n");

  return {
    subject,
    html: layout({ fromName, bodyHtml, unsubscribeUrl, mailingAddress }),
    text,
  };
}
