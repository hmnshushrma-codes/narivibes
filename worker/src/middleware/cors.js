export function buildCorsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowedOrigins = buildAllowedOrigins(env.ALLOWED_ORIGIN);
  const corsOrigin = allowedOrigins.includes(origin) ? origin : (allowedOrigins[0] || '*');

  return {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

export function handlePreflight(corsHeaders) {
  return new Response(null, { status: 204, headers: corsHeaders });
}

function buildAllowedOrigins(configured) {
  const origins = new Set([
    'http://localhost:3000', 'http://localhost:5500',
    'http://localhost:8080', 'http://127.0.0.1:5500', 'http://127.0.0.1:8080',
  ]);
  if (configured) configured.split(',').forEach(o => origins.add(o.trim()));
  return [...origins];
}
