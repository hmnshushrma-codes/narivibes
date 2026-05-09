export function generateOTP() {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return String(100000 + (arr[0] % 900000));
}

export function generateOrderId() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `LTE-${date}-${rand}`;
}

export async function parseBody(request) {
  try { return await request.json(); } catch { return {}; }
}

export function safeParseJSON(str, fallback) {
  try { return JSON.parse(str); } catch { return fallback; }
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function parseProductRow(row) {
  return {
    ...row,
    colors:   safeParseJSON(row.colors,   []),
    sizes:    safeParseJSON(row.sizes,     []),
    details:  safeParseJSON(row.details,   []),
    images:   safeParseJSON(row.images,    []),
    featured: row.featured === 1,
    status:   row.status || 'active',
  };
}
