/**
 * L'ÉTÉ — NariVibes Brand
 * Cloudflare Worker — Main Entry Point
 *
 * Public routes:
 *   POST /api/otp/send              — Generate & email OTP (KV, 10-min TTL)
 *   POST /api/otp/verify            — Verify OTP; mark email as verified (KV, 1-hr TTL)
 *   POST /api/payment/create        — Create Razorpay order
 *   POST /api/payment/verify        — Verify Razorpay HMAC-SHA256 signature
 *   POST /api/orders                — Save confirmed order to D1
 *   GET  /api/orders/:id            — Fetch a single order by ID
 *   GET  /api/products              — List active products (optional filters)
 *   GET  /api/products/:id          — Get a single product by ID
 *
 * Admin routes (require Authorization: Bearer <token>):
 *   POST  /api/admin/request-otp    — Validate email + secret, send admin OTP
 *   POST  /api/admin/verify-otp     — Verify admin OTP, return session token
 *   POST  /api/admin/logout         — Invalidate admin session
 *   GET   /api/admin/orders         — List all orders (paginated, filterable)
 *   PATCH /api/admin/orders/:id     — Update order status
 *   GET   /api/admin/products       — List ALL products (incl. hidden/discontinued)
 *   PATCH /api/admin/products/:id   — Update product status, stock, badge, featured
 */

export default {
  async fetch(request, env, ctx) {
    // -------------------------------------------------------------------------
    // CORS
    // -------------------------------------------------------------------------
    const origin = request.headers.get('Origin') || '';
    const allowedOrigins = buildAllowedOrigins(env.ALLOWED_ORIGIN);
    const corsOrigin = allowedOrigins.includes(origin) ? origin : (allowedOrigins[0] || '*');

    const corsHeaders = {
      'Access-Control-Allow-Origin': corsOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url  = new URL(request.url);
    const path = url.pathname;

    try {
      // -----------------------------------------------------------------------
      // Public routes
      // -----------------------------------------------------------------------
      if (path === '/api/otp/send' && request.method === 'POST') {
        return await handleOtpSend(request, env, corsHeaders);
      }
      if (path === '/api/otp/verify' && request.method === 'POST') {
        return await handleOtpVerify(request, env, corsHeaders);
      }
      if (path === '/api/payment/create' && request.method === 'POST') {
        return await handlePaymentCreate(request, env, corsHeaders);
      }
      if (path === '/api/payment/verify' && request.method === 'POST') {
        return await handlePaymentVerify(request, env, corsHeaders);
      }
      if (path === '/api/orders' && request.method === 'POST') {
        return await handleOrderCreate(request, env, corsHeaders);
      }
      const orderGetMatch = path.match(/^\/api\/orders\/([^/]+)$/);
      if (orderGetMatch && request.method === 'GET') {
        return await handleOrderGet(orderGetMatch[1], env, corsHeaders);
      }
      if (path === '/api/products' && request.method === 'GET') {
        return await handleProductsList(url, env, corsHeaders);
      }
      const productGetMatch = path.match(/^\/api\/products\/([^/]+)$/);
      if (productGetMatch && request.method === 'GET') {
        return await handleProductGet(productGetMatch[1], env, corsHeaders);
      }

      // -----------------------------------------------------------------------
      // Admin routes
      // -----------------------------------------------------------------------
      if (path === '/api/admin/request-otp' && request.method === 'POST') {
        return await handleAdminRequestOtp(request, env, corsHeaders);
      }
      if (path === '/api/admin/verify-otp' && request.method === 'POST') {
        return await handleAdminVerifyOtp(request, env, corsHeaders);
      }
      if (path === '/api/admin/logout' && request.method === 'POST') {
        return await handleAdminLogout(request, env, corsHeaders);
      }
      if (path === '/api/admin/orders' && request.method === 'GET') {
        return await handleAdminOrdersList(request, url, env, corsHeaders);
      }
      const adminOrderPatch = path.match(/^\/api\/admin\/orders\/([^/]+)$/);
      if (adminOrderPatch && request.method === 'PATCH') {
        return await handleAdminOrderPatch(adminOrderPatch[1], request, env, corsHeaders);
      }
      if (path === '/api/admin/products' && request.method === 'GET') {
        return await handleAdminProductsList(request, url, env, corsHeaders);
      }
      const adminProductPatch = path.match(/^\/api\/admin\/products\/([^/]+)$/);
      if (adminProductPatch && request.method === 'PATCH') {
        return await handleAdminProductPatch(adminProductPatch[1], request, env, corsHeaders);
      }

      // Health check
      if (path === '/api/health' && request.method === 'GET') {
        return Response.json({ status: 'ok', ts: new Date().toISOString() }, { headers: corsHeaders });
      }

      return Response.json({ error: 'Not found' }, { status: 404, headers: corsHeaders });

    } catch (err) {
      console.error('[Worker] Unhandled error:', err);
      return Response.json(
        { error: 'Internal server error', detail: err.message },
        { status: 500, headers: corsHeaders }
      );
    }
  }
};

// =============================================================================
// Public route handlers
// =============================================================================

// POST /api/otp/send
async function handleOtpSend(request, env, corsHeaders) {
  // Rate limit: 3 sends per 10 minutes per IP
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const rl = await checkRateLimit(ip, 'otp_send', 3, 600, env);
  if (rl.limited) {
    return Response.json(
      { error: 'Too many OTP requests. Please wait a few minutes and try again.' },
      { status: 429, headers: { ...corsHeaders, 'Retry-After': '600' } }
    );
  }

  const body  = await parseBody(request);
  const email = (body.email || '').trim().toLowerCase();

  if (!isValidEmail(email)) {
    return Response.json({ error: 'A valid email address is required.' }, { status: 400, headers: corsHeaders });
  }

  // Verify Turnstile token (skip if secret not configured)
  if (env.TURNSTILE_SECRET_KEY && env.TURNSTILE_SECRET_KEY !== 'YOUR_TURNSTILE_SECRET_KEY') {
    const valid = await verifyTurnstile(body.turnstileToken || '', ip, env.TURNSTILE_SECRET_KEY);
    if (!valid) {
      return Response.json({ error: 'Security check failed. Please refresh and try again.' }, { status: 403, headers: corsHeaders });
    }
  }

  const otp = generateOTP();
  await env.OTP_STORE.put(`otp:${email}`, otp, { expirationTtl: 600 });

  const emailSent = await sendOTPEmail(email, otp);
  const payload   = { success: true, message: 'OTP sent successfully.' };
  if (!emailSent || env.ENVIRONMENT === 'development') {
    payload.otp  = otp;
    payload.note = 'OTP exposed (dev mode or email delivery issue).';
  }
  return Response.json(payload, { status: 200, headers: corsHeaders });
}

// POST /api/otp/verify
async function handleOtpVerify(request, env, corsHeaders) {
  // Rate limit: 5 attempts per 5 minutes per IP
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const rl = await checkRateLimit(ip, 'otp_verify', 5, 300, env);
  if (rl.limited) {
    return Response.json(
      { error: 'Too many verification attempts. Please wait before trying again.' },
      { status: 429, headers: { ...corsHeaders, 'Retry-After': '300' } }
    );
  }

  const body  = await parseBody(request);
  const email = (body.email || '').trim().toLowerCase();
  const otp   = (body.otp   || '').trim();

  if (!isValidEmail(email)) {
    return Response.json({ error: 'A valid email address is required.' }, { status: 400, headers: corsHeaders });
  }
  if (!otp || !/^\d{6}$/.test(otp)) {
    return Response.json({ error: 'A valid 6-digit OTP is required.' }, { status: 400, headers: corsHeaders });
  }

  const stored = await env.OTP_STORE.get(`otp:${email}`);
  if (!stored)       return Response.json({ error: 'OTP has expired. Please request a new one.' }, { status: 400, headers: corsHeaders });
  if (stored !== otp) return Response.json({ error: 'Incorrect OTP. Please try again.'          }, { status: 400, headers: corsHeaders });

  await env.OTP_STORE.put(`verified:${email}`, '1', { expirationTtl: 3600 });
  await env.OTP_STORE.delete(`otp:${email}`);

  return Response.json({ success: true, message: 'Email verified.', email }, { status: 200, headers: corsHeaders });
}

// POST /api/payment/create
async function handlePaymentCreate(request, env, corsHeaders) {
  // Rate limit: 5 payment attempts per minute per IP
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const rl = await checkRateLimit(ip, 'payment_create', 5, 60, env);
  if (rl.limited) {
    return Response.json(
      { error: 'Too many payment requests. Please wait a moment.' },
      { status: 429, headers: { ...corsHeaders, 'Retry-After': '60' } }
    );
  }

  const body   = await parseBody(request);
  const amount = parseInt(body.amount, 10);

  if (!amount || amount < 100) {
    return Response.json({ error: 'Valid amount (paise, min 100) required.' }, { status: 400, headers: corsHeaders });
  }

  const receipt = 'rcpt_' + Date.now().toString(36).toUpperCase();
  const auth    = btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);

  const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, currency: body.currency || 'INR', receipt }),
  });

  if (!rzpRes.ok) {
    const err = await rzpRes.json().catch(() => ({}));
    return Response.json({ error: 'Failed to create payment order.', detail: err.error?.description }, { status: 502, headers: corsHeaders });
  }

  const order = await rzpRes.json();
  return Response.json({ razorpay_order_id: order.id, amount: order.amount, currency: order.currency }, { status: 200, headers: corsHeaders });
}

// POST /api/payment/verify
async function handlePaymentVerify(request, env, corsHeaders) {
  const body = await parseBody(request);
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return Response.json({ error: 'razorpay_order_id, razorpay_payment_id, razorpay_signature all required.' }, { status: 400, headers: corsHeaders });
  }

  const valid = await verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature, env.RAZORPAY_KEY_SECRET);
  if (!valid) {
    return Response.json({ error: 'Payment signature verification failed.' }, { status: 400, headers: corsHeaders });
  }

  return Response.json({ success: true, message: 'Payment verified.', razorpay_payment_id }, { status: 200, headers: corsHeaders });
}

// POST /api/orders
async function handleOrderCreate(request, env, corsHeaders) {
  const body  = await parseBody(request);
  const email = (body.customer_email || '').trim().toLowerCase();

  if (!isValidEmail(email)) {
    return Response.json({ error: 'Valid customer_email required.' }, { status: 400, headers: corsHeaders });
  }
  const verified = await env.OTP_STORE.get(`verified:${email}`);
  if (!verified) {
    return Response.json({ error: 'Email not verified. Complete OTP verification first.' }, { status: 403, headers: corsHeaders });
  }
  if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
    return Response.json({ error: 'Order must contain at least one item.' }, { status: 400, headers: corsHeaders });
  }

  const orderId = generateOrderId();
  const now     = new Date().toISOString();

  await env.DB.prepare(`
    INSERT INTO orders (
      id, customer_email, customer_name, customer_phone,
      shipping_address, items, subtotal, shipping, total,
      razorpay_order_id, razorpay_payment_id,
      payment_status, order_status, created_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).bind(
    orderId, email,
    body.customer_name  || null,
    body.customer_phone || null,
    JSON.stringify(body.shipping_address || {}),
    JSON.stringify(body.items),
    body.subtotal || 0, body.shipping || 0, body.total,
    body.razorpay_order_id  || null,
    body.razorpay_payment_id || null,
    'paid', 'placed', now
  ).run();

  return Response.json({ success: true, id: orderId, order_id: orderId, created_at: now }, { status: 201, headers: corsHeaders });
}

// GET /api/orders/:id
async function handleOrderGet(id, env, corsHeaders) {
  const row = await env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(id).first();
  if (!row) return Response.json({ error: 'Order not found.' }, { status: 404, headers: corsHeaders });
  return Response.json({
    ...row,
    shipping_address: safeParseJSON(row.shipping_address, {}),
    items: safeParseJSON(row.items, []),
  }, { status: 200, headers: corsHeaders });
}

// GET /api/products  (only active products for storefront)
async function handleProductsList(url, env, corsHeaders) {
  const category = url.searchParams.get('category') || null;
  const featured = url.searchParams.get('featured')  || null;
  const limit    = Math.min(parseInt(url.searchParams.get('limit')  || '50', 10), 100);
  const offset   = parseInt(url.searchParams.get('offset') || '0', 10);

  // Always filter to active products in the public endpoint
  const conditions = ['(status = ? OR status IS NULL)'];
  const bindings   = ['active'];

  if (category) { conditions.push('category = ?'); bindings.push(category); }
  if (featured !== null) { conditions.push('featured = ?'); bindings.push(featured === '1' ? 1 : 0); }

  const query = `SELECT * FROM products WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  bindings.push(limit, offset);

  const result   = await env.DB.prepare(query).bind(...bindings).all();
  const products = (result.results || []).map(parseProductRow);
  return Response.json({ products, count: products.length }, { status: 200, headers: corsHeaders });
}

// GET /api/products/:id
async function handleProductGet(id, env, corsHeaders) {
  const row = await env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(id).first();
  if (!row) return Response.json({ error: 'Product not found.' }, { status: 404, headers: corsHeaders });
  return Response.json(parseProductRow(row), { status: 200, headers: corsHeaders });
}

// =============================================================================
// Admin route handlers
// =============================================================================

// POST /api/admin/request-otp
// Body: { email, adminSecret }
async function handleAdminRequestOtp(request, env, corsHeaders) {
  // Rate limit: 5 attempts per 15 minutes per IP
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const rl = await checkRateLimit(ip, 'admin_otp', 5, 900, env);
  if (rl.limited) {
    return Response.json(
      { error: 'Too many login attempts. Please wait 15 minutes.' },
      { status: 429, headers: { ...corsHeaders, 'Retry-After': '900' } }
    );
  }

  const body   = await parseBody(request);
  const email  = (body.email       || '').trim().toLowerCase();
  const secret = (body.adminSecret || '').trim();

  if (!isValidEmail(email)) {
    return Response.json({ error: 'A valid email is required.' }, { status: 400, headers: corsHeaders });
  }

  // Validate allowed email list
  const allowed = (env.ALLOWED_ADMIN_EMAIL || '')
    .split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
  if (!allowed.includes(email)) {
    return Response.json({ error: 'Invalid credentials.' }, { status: 401, headers: corsHeaders });
  }

  // Validate admin secret
  if (!env.ADMIN_SECRET || secret !== env.ADMIN_SECRET) {
    return Response.json({ error: 'Invalid credentials.' }, { status: 401, headers: corsHeaders });
  }

  // Rate-limit: don't allow re-sending within 60s
  const existing = await env.OTP_STORE.get(`admin_otp:${email}`);
  // (No strict block — just regenerate; TTL prevents indefinite spam)

  const otp = generateOTP();
  await env.OTP_STORE.put(`admin_otp:${email}`, otp, { expirationTtl: 600 });

  const emailSent = await sendAdminOTPEmail(email, otp);
  const payload   = { success: true, message: 'Admin OTP sent.' };
  if (!emailSent || env.ENVIRONMENT === 'development') {
    payload.otp  = otp;
    payload.note = 'OTP exposed (dev mode or email delivery issue).';
  }
  return Response.json(payload, { status: 200, headers: corsHeaders });
}

// POST /api/admin/verify-otp
// Body: { email, otp }
async function handleAdminVerifyOtp(request, env, corsHeaders) {
  const body  = await parseBody(request);
  const email = (body.email || '').trim().toLowerCase();
  const otp   = (body.otp   || '').trim();

  if (!isValidEmail(email) || !/^\d{6}$/.test(otp)) {
    return Response.json({ error: 'Valid email and 6-digit OTP required.' }, { status: 400, headers: corsHeaders });
  }

  const stored = await env.OTP_STORE.get(`admin_otp:${email}`);
  if (!stored || stored !== otp) {
    return Response.json({ error: 'Invalid or expired OTP.' }, { status: 401, headers: corsHeaders });
  }

  await env.OTP_STORE.delete(`admin_otp:${email}`);

  // Create 8-hour session
  const token   = crypto.randomUUID();
  const session = JSON.stringify({ email, createdAt: new Date().toISOString() });
  await env.OTP_STORE.put(`admin_session:${token}`, session, { expirationTtl: 28800 });

  return Response.json({ success: true, token, email }, { status: 200, headers: corsHeaders });
}

// POST /api/admin/logout
async function handleAdminLogout(request, env, corsHeaders) {
  const session = await requireAdmin(request, env);
  if (session) {
    const token = (request.headers.get('Authorization') || '').slice(7).trim();
    await env.OTP_STORE.delete(`admin_session:${token}`);
  }
  return Response.json({ success: true }, { status: 200, headers: corsHeaders });
}

// GET /api/admin/orders
async function handleAdminOrdersList(request, url, env, corsHeaders) {
  const session = await requireAdmin(request, env);
  if (!session) return Response.json({ error: 'Unauthorized.' }, { status: 401, headers: corsHeaders });

  const page   = Math.max(1, parseInt(url.searchParams.get('page')  || '1',  10));
  const limit  = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100);
  const offset = (page - 1) * limit;
  const status = url.searchParams.get('status') || null;

  const conditions = [];
  const bindings   = [];
  if (status) { conditions.push('order_status = ?'); bindings.push(status); }

  const where    = conditions.length ? ' WHERE ' + conditions.join(' AND ') : '';
  const query    = `SELECT * FROM orders${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  const cntQuery = `SELECT COUNT(*) as total FROM orders${where}`;

  const [result, countRow] = await Promise.all([
    env.DB.prepare(query).bind(...bindings, limit, offset).all(),
    env.DB.prepare(cntQuery).bind(...bindings).first(),
  ]);

  const orders = (result.results || []).map(row => ({
    ...row,
    shipping_address: safeParseJSON(row.shipping_address, {}),
    items: safeParseJSON(row.items, []),
  }));

  return Response.json({
    orders,
    total: countRow?.total || 0,
    page,
    limit,
    pages: Math.ceil((countRow?.total || 0) / limit),
  }, { status: 200, headers: corsHeaders });
}

// PATCH /api/admin/orders/:id
// Body: { order_status }
async function handleAdminOrderPatch(id, request, env, corsHeaders) {
  const session = await requireAdmin(request, env);
  if (!session) return Response.json({ error: 'Unauthorized.' }, { status: 401, headers: corsHeaders });

  const body          = await parseBody(request);
  const validStatuses = ['placed', 'processing', 'shipped', 'delivered', 'cancelled'];

  if (!body.order_status || !validStatuses.includes(body.order_status)) {
    return Response.json({ error: `order_status must be one of: ${validStatuses.join(', ')}` }, { status: 400, headers: corsHeaders });
  }

  const existing = await env.DB.prepare('SELECT id FROM orders WHERE id = ?').bind(id).first();
  if (!existing) return Response.json({ error: 'Order not found.' }, { status: 404, headers: corsHeaders });

  await env.DB.prepare('UPDATE orders SET order_status = ? WHERE id = ?').bind(body.order_status, id).run();

  const updated = await env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(id).first();
  return Response.json({
    ...updated,
    shipping_address: safeParseJSON(updated.shipping_address, {}),
    items: safeParseJSON(updated.items, []),
  }, { status: 200, headers: corsHeaders });
}

// GET /api/admin/products  (returns ALL — including hidden & discontinued)
async function handleAdminProductsList(request, url, env, corsHeaders) {
  const session = await requireAdmin(request, env);
  if (!session) return Response.json({ error: 'Unauthorized.' }, { status: 401, headers: corsHeaders });

  const limit  = Math.min(parseInt(url.searchParams.get('limit')  || '200', 10), 500);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);

  const result   = await env.DB.prepare('SELECT * FROM products ORDER BY name ASC LIMIT ? OFFSET ?').bind(limit, offset).all();
  const products = (result.results || []).map(parseProductRow);
  return Response.json({ products, count: products.length }, { status: 200, headers: corsHeaders });
}

// PATCH /api/admin/products/:id
// Body: { status?, stock?, badge?, featured? }
async function handleAdminProductPatch(id, request, env, corsHeaders) {
  const session = await requireAdmin(request, env);
  if (!session) return Response.json({ error: 'Unauthorized.' }, { status: 401, headers: corsHeaders });

  const body = await parseBody(request);

  const existing = await env.DB.prepare('SELECT id FROM products WHERE id = ?').bind(id).first();
  if (!existing) return Response.json({ error: 'Product not found.' }, { status: 404, headers: corsHeaders });

  const validStatuses = ['active', 'hidden', 'discontinued'];
  const updates  = [];
  const bindings = [];

  if (body.status !== undefined) {
    if (!validStatuses.includes(body.status)) {
      return Response.json({ error: `status must be one of: ${validStatuses.join(', ')}` }, { status: 400, headers: corsHeaders });
    }
    updates.push('status = ?'); bindings.push(body.status);
  }
  if (body.stock !== undefined) {
    const stock = parseInt(body.stock, 10);
    if (isNaN(stock) || stock < 0) {
      return Response.json({ error: 'stock must be a non-negative integer.' }, { status: 400, headers: corsHeaders });
    }
    updates.push('stock = ?'); bindings.push(stock);
  }
  if (body.badge !== undefined) {
    updates.push('badge = ?'); bindings.push(body.badge || null);
  }
  if (body.featured !== undefined) {
    updates.push('featured = ?'); bindings.push(body.featured ? 1 : 0);
  }

  if (updates.length === 0) {
    return Response.json({ error: 'No updatable fields provided (status, stock, badge, featured).' }, { status: 400, headers: corsHeaders });
  }

  bindings.push(id);
  await env.DB.prepare(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`).bind(...bindings).run();

  const updated = await env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(id).first();
  return Response.json(parseProductRow(updated), { status: 200, headers: corsHeaders });
}

// =============================================================================
// Admin middleware
// =============================================================================

async function requireAdmin(request, env) {
  const auth = request.headers.get('Authorization') || '';
  if (!auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7).trim();
  if (!token) return null;
  const raw = await env.OTP_STORE.get(`admin_session:${token}`);
  if (!raw) return null;
  return safeParseJSON(raw, null);
}

// =============================================================================
// Utility helpers
// =============================================================================

function generateOTP() {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return String(100000 + (arr[0] % 900000));
}

function generateOrderId() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `LTE-${date}-${rand}`;
}

async function verifyRazorpaySignature(orderId, paymentId, signature, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const signed = await crypto.subtle.sign('HMAC', key, encoder.encode(`${orderId}|${paymentId}`));
  const hash   = Array.from(new Uint8Array(signed)).map(b => b.toString(16).padStart(2, '0')).join('');
  return hash === signature;
}

async function sendOTPEmail(email, otp) {
  try {
    const res = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{ to: [{ email }] }],
        from: { email: 'noreply@narivibe.com', name: "L'ÉTÉ" },
        subject: "Your L'ÉTÉ verification code",
        content: [{ type: 'text/html', value: buildOTPEmailHtml(otp, false) }],
      }),
    });
    return res.ok;
  } catch { return false; }
}

async function sendAdminOTPEmail(email, otp) {
  try {
    const res = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{ to: [{ email }] }],
        from: { email: 'noreply@narivibe.com', name: "L'ÉTÉ Admin" },
        subject: "L'ÉTÉ Admin — Your verification code",
        content: [{ type: 'text/html', value: buildOTPEmailHtml(otp, true) }],
      }),
    });
    return res.ok;
  } catch { return false; }
}

function buildOTPEmailHtml(otp, isAdmin = false) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f9f9f9;font-family:Georgia,serif;">
  <div style="max-width:480px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(112,88,91,0.1);">
    <div style="background:#70585b;padding:32px 40px;text-align:center;">
      <h1 style="margin:0;font-size:28px;font-weight:400;color:#fff;letter-spacing:6px;">L'ÉTÉ</h1>
      <p style="margin:4px 0 0;font-size:11px;color:rgba(255,255,255,.7);letter-spacing:.2em;font-family:Arial,sans-serif;text-transform:uppercase;">${isAdmin ? 'Admin Panel' : 'Summer Collection'}</p>
    </div>
    <div style="padding:40px;">
      <p style="color:#4f4445;font-size:16px;margin:0 0 8px;">Your verification code</p>
      <p style="color:#807475;font-size:14px;margin:0 0 28px;font-family:Arial,sans-serif;">Use this code to ${isAdmin ? 'access the admin panel' : 'complete your order'}.</p>
      <div style="background:#fadadd;border-radius:10px;padding:28px 20px;text-align:center;margin-bottom:28px;">
        <span style="font-size:40px;font-weight:700;color:#70585b;letter-spacing:14px;font-family:Arial,sans-serif;">${otp}</span>
      </div>
      <p style="color:#807475;font-size:13px;margin:0;font-family:Arial,sans-serif;">Valid for <strong>10 minutes</strong>. If you didn't request this, ignore it.</p>
    </div>
    <div style="border-top:1px solid #f0e8e8;padding:20px 40px;text-align:center;">
      <p style="color:#b0a0a1;font-size:11px;margin:0;font-family:Arial,sans-serif;letter-spacing:.1em;">© 2024 L'ÉTÉ SUMMER COLLECTIONS</p>
    </div>
  </div>
</body></html>`;
}

async function parseBody(request) {
  try { return await request.json(); } catch { return {}; }
}

function safeParseJSON(str, fallback) {
  try { return JSON.parse(str); } catch { return fallback; }
}

function parseProductRow(row) {
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

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function buildAllowedOrigins(configured) {
  const origins = new Set([
    'http://localhost:3000', 'http://localhost:5500',
    'http://localhost:8080', 'http://127.0.0.1:5500', 'http://127.0.0.1:8080',
  ]);
  if (configured) configured.split(',').forEach(o => origins.add(o.trim()));
  return [...origins];
}

// KV-backed fixed-window rate limiter
// Returns { limited: true } if limit exceeded, { limited: false } otherwise
async function checkRateLimit(ip, endpoint, limit, windowSeconds, env) {
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

// Verify a Cloudflare Turnstile token server-side
async function verifyTurnstile(token, ip, secretKey) {
  if (!token) return false;
  try {
    const form = new FormData();
    form.append('secret', secretKey);
    form.append('response', token);
    form.append('remoteip', ip);
    const res    = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form });
    const result = await res.json();
    return result.success === true;
  } catch {
    return false;
  }
}
