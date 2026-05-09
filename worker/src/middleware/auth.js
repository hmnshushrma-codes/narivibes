import { safeParseJSON } from '../utils/helpers.js';

/**
 * Validates admin session from Authorization: Bearer <token> header.
 * Returns the session object if valid, null otherwise.
 */
export async function requireAdmin(request, env) {
  const auth = request.headers.get('Authorization') || '';
  if (!auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7).trim();
  if (!token) return null;
  const raw = await env.OTP_STORE.get(`admin_session:${token}`);
  if (!raw) return null;
  return safeParseJSON(raw, null);
}
