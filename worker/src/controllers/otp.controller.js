import { parseBody, isValidEmail, generateOTP } from '../utils/helpers.js';
import { checkRateLimit } from '../utils/rate-limit.js';
import { sendOTPEmail } from '../services/email.service.js';
import * as turnstile from '../services/turnstile.service.js';

export async function send({ request, env, corsHeaders }) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const rl = await checkRateLimit(ip, 'otp_send', 3, 600, env);
  if (rl.limited) {
    return Response.json(
      { error: 'Too many OTP requests. Please wait a few minutes and try again.' },
      { status: 429, headers: { ...corsHeaders, 'Retry-After': '600' } }
    );
  }

  const body = await parseBody(request);
  const email = (body.email || '').trim().toLowerCase();

  if (!isValidEmail(email)) {
    return Response.json({ error: 'A valid email address is required.' }, { status: 400, headers: corsHeaders });
  }

  if (env.TURNSTILE_SECRET_KEY && env.TURNSTILE_SECRET_KEY !== 'YOUR_TURNSTILE_SECRET_KEY') {
    const valid = await turnstile.verify(body.turnstileToken || '', ip, env.TURNSTILE_SECRET_KEY);
    if (!valid) {
      return Response.json({ error: 'Security check failed. Please refresh and try again.' }, { status: 403, headers: corsHeaders });
    }
  }

  const otp = generateOTP();
  await env.OTP_STORE.put(`otp:${email}`, otp, { expirationTtl: 600 });

  const emailSent = await sendOTPEmail(email, otp, env);
  const payload = { success: true, message: 'OTP sent successfully.' };
  if (!emailSent || env.ENVIRONMENT === 'development') {
    payload.otp = otp;
    payload.note = 'OTP exposed (dev mode or email delivery issue).';
  }
  return Response.json(payload, { status: 200, headers: corsHeaders });
}

export async function verify({ request, env, corsHeaders }) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const rl = await checkRateLimit(ip, 'otp_verify', 5, 300, env);
  if (rl.limited) {
    return Response.json(
      { error: 'Too many verification attempts. Please wait before trying again.' },
      { status: 429, headers: { ...corsHeaders, 'Retry-After': '300' } }
    );
  }

  const body = await parseBody(request);
  const email = (body.email || '').trim().toLowerCase();
  const otp = (body.otp || '').trim();

  if (!isValidEmail(email)) {
    return Response.json({ error: 'A valid email address is required.' }, { status: 400, headers: corsHeaders });
  }
  if (!otp || !/^\d{6}$/.test(otp)) {
    return Response.json({ error: 'A valid 6-digit OTP is required.' }, { status: 400, headers: corsHeaders });
  }

  const stored = await env.OTP_STORE.get(`otp:${email}`);
  if (!stored) return Response.json({ error: 'OTP has expired. Please request a new one.' }, { status: 400, headers: corsHeaders });
  if (stored !== otp) return Response.json({ error: 'Incorrect OTP. Please try again.' }, { status: 400, headers: corsHeaders });

  await env.OTP_STORE.put(`verified:${email}`, '1', { expirationTtl: 3600 });
  await env.OTP_STORE.delete(`otp:${email}`);

  return Response.json({ success: true, message: 'Email verified.', email }, { status: 200, headers: corsHeaders });
}
