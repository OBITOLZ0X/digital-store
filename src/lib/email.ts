// Email utility — hybrid: MailChannels (Cloudflare Workers / edge) + Nodemailer (Node/Vercel).
// On Cloudflare Pages/Workers TCP to smtp.gmail.com:587 is blocked — so we send via HTTP.
// MailChannels is 100% free on Cloudflare (no API key, uses fetch) — works on edge.
// Locally / on Vercel we still use Gmail SMTP via nodemailer.
type EmailPayload = { to: string; subject: string; html: string; text?: string }

async function sendViaMailChannels(payload: EmailPayload): Promise<{ ok: boolean; error?: string }> {
  const fromEmail = (process.env.MAIL_FROM || process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@digitalstore.dz').trim()
  const fromName = process.env.MAIL_FROM_NAME || 'DigitalStore'
  // MailChannels requires a domain that doesn't have strict DMARC p=reject (gmail.com has p=reject).
  // If fromEmail is gmail.com, rewrite to noreply@digitalstore.dz but keep reply-to as gmail.
  const isGmailFrom = fromEmail.toLowerCase().endsWith('@gmail.com')
  const effectiveFrom = isGmailFrom ? 'noreply@digitalstore.dz' : fromEmail
  const replyTo = isGmailFrom ? fromEmail : undefined

  const body = {
    personalizations: [
      {
        to: [{ email: payload.to }],
        // dkim/spf handled by Cloudflare Email Routing / MailChannels relay
      },
    ],
    from: { email: effectiveFrom, name: fromName },
    reply_to: replyTo ? { email: replyTo, name: fromName } : undefined,
    subject: payload.subject,
    content: [
      { type: 'text/plain', value: payload.text || payload.html.replace(/<[^>]+>/g, '') },
      { type: 'text/html', value: payload.html },
    ],
  }

  const res = await fetch('https://api.mailchannels.net/tx/v1/send', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (res.status === 202 || res.status === 200 || res.status === 204) return { ok: true }
  const txt = await res.text().catch(() => '')
  return { ok: false, error: `MailChannels ${res.status}: ${txt.slice(0, 500)}` }
}

async function sendViaNodemailer(payload: EmailPayload): Promise<{ ok: boolean; error?: string }> {
  // Dynamic import — nodemailer is Node-only and breaks edge bundling if imported at top level.
  // @ts-ignore
  const nodemailer = (await import('nodemailer')).default ?? (await import('nodemailer'))
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || 587)
  const user = process.env.SMTP_USER
  const passRaw = process.env.SMTP_PASS
  if (!host || !user || !passRaw) return { ok: false, error: 'SMTP not configured' }
  const pass = passRaw.replace(/\s+/g, '')
  const transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } })
  const from = process.env.SMTP_FROM || process.env.SMTP_USER
  await transporter.sendMail({ from, to: payload.to, subject: payload.subject, html: payload.html, text: payload.text })
  return { ok: true }
}

export async function sendEmail(payload: EmailPayload): Promise<{ ok: boolean; error?: string }> {
  // 1) On edge / Cloudflare, try MailChannels (HTTP) first — SMTP TCP is blocked there.
  // Detect edge: NEXT_RUNTIME=edge is set by Next.js, or CF_PAGES env.
  const isEdge = (process.env.NEXT_RUNTIME as string) === 'edge' || !!process.env.CF_PAGES || typeof (globalThis as any).EdgeRuntime !== 'undefined'
  if (isEdge) {
    const mc = await sendViaMailChannels(payload).catch((e) => ({ ok: false as const, error: e instanceof Error ? e.message : String(e) }))
    if (mc.ok) return mc
    console.warn('[email] MailChannels failed, will try SMTP fallback (likely blocked on edge):', mc.error)
    // Fallthrough to SMTP attempt for logging — but it will almost certainly fail on Workers.
  }

  // 2) Try MailChannels even on Node — it's free and doesn't need SMTP credentials, so prefer it if SMTP is not configured.
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    const mc = await sendViaMailChannels(payload).catch((e) => ({ ok: false as const, error: e instanceof Error ? e.message : String(e) }))
    if (mc.ok) return mc
    console.log('[email] No SMTP and MailChannels failed:', mc.error)
    return { ok: false, error: mc.error || 'No email transport configured' }
  }

  // 3) Full SMTP path (local dev + Vercel)
  try {
    return await sendViaNodemailer(payload)
  } catch (e) {
    console.error('[email] SMTP send failed:', e)
    // Last resort: try MailChannels as fallback even when SMTP is configured
    const mc = await sendViaMailChannels(payload).catch(() => null)
    if (mc?.ok) return mc
    return { ok: false, error: e instanceof Error ? e.message : 'send failed' }
  }
}

// Order confirmation email (English)
export function orderConfirmationEmail(opts: {
  orderNumber: string
  productName: string
  total: number
  currency: string
  siteName?: string
}): { subject: string; html: string; text: string } {
  const site = opts.siteName || 'DigitalStore'
  const subject = `✅ Order ${opts.orderNumber} confirmed — ${site}`
  const html = `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#0b0b0f;color:#e4e4e7;padding:32px;border-radius:16px">
    <h2 style="color:#a78bfa;margin:0 0 8px">Order Confirmed ✅</h2>
    <p style="color:#a1a1aa">Your order has been confirmed and delivered. Open the <b>Orders</b> page and click this order to see your product details (code / account).</p>
    <div style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:16px;margin:20px 0">
      <div style="color:#71717a;font-size:12px">Order Number</div>
      <div style="color:#fff;font-size:18px;font-weight:bold">${opts.orderNumber}</div>
      <div style="color:#71717a;font-size:12px;margin-top:12px">Product</div>
      <div style="color:#fff">${opts.productName}</div>
      <div style="color:#71717a;font-size:12px;margin-top:12px">Total</div>
      <div style="color:#a78bfa;font-weight:bold">${Number(opts.total).toFixed(2)} ${opts.currency}</div>
    </div>
    <p style="color:#52525b;font-size:12px">${site} — do not reply to this email.</p>
  </div>`
  const text = `Your order ${opts.orderNumber} (${opts.productName}) has been confirmed. Open the Orders page in your account to see the delivered code/account.`
  return { subject, html, text }
}

// Email verification — new account (English, branded)
export function verificationEmail(opts: {
  confirmationUrl: string
  email?: string
  siteName?: string
  siteUrl?: string
}): { subject: string; html: string; text: string } {
  const site = opts.siteName || 'DigitalStore'
  const url = opts.siteUrl || ''
  const subject = `Verify your email — ${site}`
  const html = `
  <div style="margin:0;padding:0;background:#09090b;">
    <div style="max-width:560px;margin:0 auto;padding:24px;">
      <!-- Header -->
      <div style="text-align:center;padding:16px 0 8px;">
        <div style="display:inline-flex;align-items:center;justify-content:center;width:52px;height:52px;border-radius:16px;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;font-weight:900;font-size:18px;letter-spacing:1px;">DS</div>
        <div style="color:#fff;font-weight:800;font-size:14px;letter-spacing:2px;margin-top:10px;">${site.toUpperCase()}</div>
      </div>
      <!-- Card -->
      <div style="background:#0b0b0f;border:1px solid #27272a;border-radius:20px;overflow:hidden;margin-top:12px;">
        <div style="height:4px;background:linear-gradient(90deg,#7c3aed,#4f46e5,#06b6d4);"></div>
        <div style="padding:32px 28px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800;">Verify your email</h1>
          <p style="margin:10px 0 0;color:#a1a1aa;font-size:14px;line-height:1.6;">Welcome to <b style="color:#e4e4e7">${site}</b> — instant digital delivery.<br/>Tap the button below to confirm your email and activate your account.</p>
          ${opts.email ? `<p style="margin:14px 0 0;color:#71717a;font-size:12px;">For: <span style="color:#e4e4e7">${opts.email}</span></p>` : ''}
          <div style="margin:24px 0 8px;">
            <a href="${opts.confirmationUrl}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;text-decoration:none;font-weight:800;font-size:14px;padding:14px 28px;border-radius:9999px;letter-spacing:0.3px;">Verify Email →</a>
          </div>
          <p style="margin:14px 0 0;color:#71717a;font-size:12px;">Link expires in 24 hours. If the button doesn't work, copy and paste this URL:</p>
          <p style="margin:8px 0 0;word-break:break-all;"><a href="${opts.confirmationUrl}" style="color:#a78bfa;font-size:12px;text-decoration:underline;">${opts.confirmationUrl}</a></p>
        </div>
        <div style="background:#18181b;border-top:1px solid #27272a;padding:16px 24px;text-align:center;">
          <p style="margin:0;color:#71717a;font-size:12px;">Didn't create an account? You can safely ignore this email.</p>
          <p style="margin:6px 0 0;color:#52525b;font-size:11px;">Need help? Contact <a href="mailto:contact@digitalstore.dz" style="color:#a78bfa;text-decoration:none;">contact@digitalstore.dz</a>${url ? ` · <a href="${url}" style="color:#a78bfa;text-decoration:none;">${url.replace(/^https?:\/\//,'')}</a>` : ''}</p>
        </div>
      </div>
      <p style="text-align:center;color:#3f3f46;font-size:11px;margin:16px 0 0;">© ${new Date().getFullYear()} ${site} — Premium digital products marketplace.</p>
    </div>
  </div>`
  const text = `Welcome to ${site}! Verify your email by opening: ${opts.confirmationUrl} (expires in 24h). If you didn't create an account, ignore this email.`
  return { subject, html, text }
}
