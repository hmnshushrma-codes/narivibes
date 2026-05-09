/**
 * Email delivery via Resend API.
 */
export async function sendEmail(to, subject, html, env, fromLabel = 'NariVibes') {
  if (!env.RESEND_API_KEY) {
    console.error('[Resend] RESEND_API_KEY secret is not set.');
    return false;
  }
  const from = env.FROM_EMAIL
    ? `${fromLabel} <${env.FROM_EMAIL}>`
    : `${fromLabel} <onboarding@resend.dev>`;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to: [to], subject, html }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`[Resend] Send failed (${res.status}): ${body}`);
    }
    return res.ok;
  } catch (err) {
    console.error('[Resend] Network error:', err.message);
    return false;
  }
}

export async function sendOTPEmail(email, otp, env) {
  return sendEmail(
    email,
    'Your NariVibes verification code',
    buildOTPEmailHtml(otp, false),
    env,
    'NariVibes'
  );
}

export async function sendAdminOTPEmail(email, otp, env) {
  return sendEmail(
    email,
    'NariVibes Admin — Your verification code',
    buildOTPEmailHtml(otp, true),
    env,
    'NariVibes Admin'
  );
}

function buildOTPEmailHtml(otp, isAdmin = false) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
</head>
<body style="margin:0;padding:0;background:#f0eeeb;font-family:Georgia,'Times New Roman',serif;-webkit-text-size-adjust:100%;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f0eeeb;">
    <tr>
      <td align="center" style="padding:48px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:500px;">

          <!-- Header -->
          <tr>
            <td style="background:#0a0a0a;padding:52px 48px 48px;text-align:center;">
              <p style="margin:0 0 16px;font-size:9px;letter-spacing:.35em;color:rgba(255,255,255,.4);font-family:Arial,Helvetica,sans-serif;text-transform:uppercase;">${isAdmin ? 'Administration' : 'NariVibes'}</p>
              <h1 style="margin:0;font-size:26px;font-weight:400;color:#ffffff;letter-spacing:.55em;font-family:Georgia,serif;text-transform:uppercase;">L&#39;ÉTÉ</h1>
              <p style="margin:14px 0 0;font-size:8px;letter-spacing:.4em;color:rgba(255,255,255,.3);font-family:Arial,Helvetica,sans-serif;text-transform:uppercase;">${isAdmin ? 'Secure Access' : 'Summer Collection'}</p>
            </td>
          </tr>

          <!-- Thin gold accent line -->
          <tr>
            <td style="background:#0a0a0a;padding:0 48px;">
              <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.15),transparent);"></div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:52px 48px 44px;">
              <p style="margin:0 0 6px;font-size:9px;letter-spacing:.25em;color:#b0a89e;font-family:Arial,Helvetica,sans-serif;text-transform:uppercase;">One-Time Code</p>
              <h2 style="margin:0 0 18px;font-size:20px;font-weight:400;color:#111111;font-family:Georgia,serif;line-height:1.4;">Your verification code</h2>
              <p style="margin:0 0 40px;font-size:13px;color:#888888;font-family:Arial,Helvetica,sans-serif;line-height:1.8;">Please enter the code below to ${isAdmin ? 'access the administration panel' : 'complete your order'}. For security, this code expires in <strong style="color:#555555;">10 minutes</strong>.</p>

              <!-- OTP -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="border:1px solid #e8e8e8;padding:36px 20px;text-align:center;background:#fafafa;">
                    <span style="font-size:42px;font-weight:300;color:#111111;letter-spacing:18px;font-family:'Courier New',monospace;">${otp}</span>
                  </td>
                </tr>
              </table>

              <p style="margin:32px 0 0;font-size:11px;color:#c0bab6;font-family:Arial,Helvetica,sans-serif;line-height:1.7;">If you did not request this, you may safely ignore this message. No action is required.</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#ffffff;padding:0 48px 44px;text-align:center;">
              <div style="height:1px;background:#eeeeee;margin-bottom:28px;"></div>
              <p style="margin:0 0 4px;font-size:9px;letter-spacing:.3em;color:#cccccc;font-family:Arial,Helvetica,sans-serif;text-transform:uppercase;">© 2026 L&#39;ÉTÉ · NariVibes</p>
              <p style="margin:0;font-size:9px;letter-spacing:.1em;color:#dddddd;font-family:Arial,Helvetica,sans-serif;">All rights reserved</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
