/**
 * Cloudflare Turnstile bot protection verification.
 */
export async function verify(token, ip, secretKey) {
  if (!token) return false;
  try {
    const form = new FormData();
    form.append('secret', secretKey);
    form.append('response', token);
    form.append('remoteip', ip);
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form });
    const result = await res.json();
    return result.success === true;
  } catch {
    return false;
  }
}
