// Email utility — uses nodemailer with SMTP config from env.
// Falls back gracefully (returns ok:false) when SMTP is not configured,
// so the app never crashes because email is missing.
import nodemailer from 'nodemailer'

type EmailPayload = { to: string; subject: string; html: string; text?: string }

function getTransporter(): nodemailer.Transporter | null {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || 587)
  const user = process.env.SMTP_USER
  const passRaw = process.env.SMTP_PASS
  if (!host || !user || !passRaw) return null
  // Gmail App Passwords are shown with spaces — SMTP needs them without spaces
  const pass = passRaw.replace(/\s+/g, '')
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })
}

export async function sendEmail(payload: EmailPayload): Promise<{ ok: boolean; error?: string }> {
  try {
    const transporter = getTransporter()
    if (!transporter) {
      console.log('[email] SMTP not configured — skipped sending to', payload.to, '| subject:', payload.subject)
      return { ok: false, error: 'SMTP not configured' }
    }
    const from = process.env.SMTP_FROM || process.env.SMTP_USER
    await transporter.sendMail({ from, to: payload.to, subject: payload.subject, html: payload.html, text: payload.text })
    return { ok: true }
  } catch (e) {
    console.error('[email] send failed:', e)
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