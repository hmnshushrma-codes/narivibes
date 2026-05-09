import { safeParseJSON } from './helpers.js';

/**
 * KV-backed fixed-window rate limiter.
 * Returns { limited: true } if limit exceeded, { limited: false } otherwise.
 */
export async function checkRateLimit(ip, endpoint, limit, windowSeconds, env) {
  const key = `rl:${ip}:${endpoint}`;
  const now = Date.now();

  const raw = await env.OTP_STORE.get(key);
  if (raw) {
    const data = safeParseJSON(raw, null);
    if (data && data.resetAt > now) {
      if (data.count >= limit) return { limited: true };
      await env.OTP_STORE.put(
        key,
        JSON.stringify({ count: data.count + 1, resetAt: data.resetAt }),
        { expirationTtl: Math.max(1, Math.ceil((data.resetAt - now) / 1000)) }
      );
      return { limited: false };
    }
  }

  const resetAt = now + windowSeconds * 1000;
  await env.OTP_STORE.put(
    key,
    JSON.stringify({ count: 1, resetAt }),
    { expirationTtl: windowSeconds }
  );
  return { limited: false };
}
