/**
 * L'ÉTÉ — NariVibes Brand
 * Cloudflare Worker — Main Entry Point
 *
 * Routes:
 *   POST /api/otp/send          — Generate & email OTP (stored in KV, 10-min TTL)
 *   POST /api/otp/verify        — Verify OTP; mark email as verified in KV (1-hr TTL)
 *   POST /api/payment/create    — Create Razorpay order; return order_id
 *   POST /api/payment/verify    — Verify Razorpay HMAC-SHA256 signature
 *   POST /api/orders            — Save confirmed order to D1 (requires verified email)
 *   GET  /api/orders/:id        — Fetch a single order by ID
 *   GET  /api/products          — List products (optional ?category= filter)
 *   GET  /api/products/:id      — Get a single product by ID
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // -----------------------------------------------------------------------
      // Route dispatch
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

      const orderMatch = path.match(/^\/api\/orders\/([^/]+)$/);
      if (orderMatch && request.method === 'GET') {
        return await handleOrderGet(orderMatch[1], env, corsHeaders);
      }

      if (path === '/api/products' && request.method === 'GET') {
        return await handleProductsList(url, env, corsHeaders);
      }

      const productMatch = path.match(/^\/api\/products\/([^/]+)$/);
      if (productMatch && request.method === 'GET') {
        return await handleProductGet(productMatch[1], env, corsHeaders);
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
// Route handlers
// =============================================================================

// -----------------------------------------------------------------------------
// POST /api/otp/send
// Body: { email: string }
// -----------------------------------------------------------------------------
async function handleOtpSend(request, env, corsHeaders) {
  const body = await parseBody(request);
  const email = (body.email || '').trim().toLowerCase();

  if (!isValidEmail(email)) {
    return Response.json({ error: 'A valid email address is required.' }, { status: 400, headers: corsHeaders });
  }

  const otp = generateOTP();
  const key = `otp:${email}`;

  // Store OTP in KV with 10-minute expiry
  await env.OTP_STORE.put(key, otp, { expirationTtl: 600 });

  // Send via MailChannels
  const emailSent = await sendOTPEmail(email, otp);

  const responsePayload = { success: true, message: 'OTP sent successfully.' };

  // Expose OTP in development mode for easy testing
  if (!emailSent || env.ENVIRONMENT === 'development') {
    responsePayload.otp = otp;
    responsePayload.note = 'OTP included in response (development mode or email delivery issue).';
  }

  return Response.json(responsePayload, { status: 200, headers: corsHeaders });
}

// -----------------------------------------------------------------------------
// POST /api/otp/verify
// Body: { email: string, otp: string }
// -----------------------------------------------------------------------------
async function handleOtpVerify(request, env, corsHeaders) {
  const body = await parseBody(request);
  const email = (body.email || '').trim().toLowerCase();
  const otp   = (body.otp || '').trim();

  if (!isValidEmail(email)) {
    return Response.json({ error: 'A valid email address is required.' }, { status: 400, headers: corsHeaders });
  }
  if (!otp || !/^\d{6}$/.test(otp)) {
    return Response.json({ error: 'A valid 6-digit OTP is required.' }, { status: 400, headers: corsHeaders });
  }

  const storedOtp = await env.OTP_STORE.get(`otp:${email}`);

  if (!storedOtp) {
    return Response.json({ error: 'OTP has expired. Please request a new one.' }, { status: 400, headers: corsHeaders });
  }
  if (storedOtp !== otp) {
    return Response.json({ error: 'Incorrect OTP. Please try again.' }, { status: 400, headers: corsHeaders });
  }

  // Mark email as verified for 1 hour
  await env.OTP_STORE.put(`verified:${email}`, '1', { expirationTtl: 3600 });

  // Clean up the used OTP immediately
  await env.OTP_STORE.delete(`otp:${email}`);

  return Response.json({ success: true, message: 'Email verified successfully.', email }, { status: 200, headers: corsHeaders });
}

// -----------------------------------------------------------------------------
// POST /api/payment/create
// Body: { amount: number (paise), currency?: string }
// -----------------------------------------------------------------------------
async function handlePaymentCreate(request, env, corsHeaders) {
  const body = await parseBody(request);
  const amount = parseInt(body.amount, 10);

  if (!amount || amount < 100) {
    return Response.json({ error: 'A valid amount (in paise, min 100) is required.' }, { status: 400, headers: corsHeaders });
  }

  const currency = body.currency || 'INR';
  const receipt  = 'rcpt_' + Date.now().toString(36).toUpperCase();

  const auth = btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);

  const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount, currency, receipt }),
  });

  if (!rzpRes.ok) {
    const errData = await rzpRes.json().catch(() => ({}));
    console.error('[Razorpay] Order creation failed:', errData);
    return Response.json(
      { error: 'Failed to create payment order.', detail: errData.error?.description },
      { status: 502, headers: corsHeaders }
    );
  }

  const rzpOrder = await rzpRes.json();

  return Response.json(
    {
      razorpay_order_id: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
    },
    { status: 200, headers: corsHeaders }
  );
}

// -----------------------------------------------------------------------------
// POST /api/payment/verify
// Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
// -----------------------------------------------------------------------------
async function handlePaymentVerify(request, env, corsHeaders) {
  const body = await parseBody(request);
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return Response.json(
      { error: 'razorpay_order_id, razorpay_payment_id, and razorpay_signature are all required.' },
      { status: 400, headers: corsHeaders }
    );
  }

  const isValid = await verifyRazorpaySignature(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    env.RAZORPAY_KEY_SECRET
  );

  if (!isValid) {
    return Response.json({ error: 'Payment signature verification failed.' }, { status: 400, headers: corsHeaders });
  }

  return Response.json(
    { success: true, message: 'Payment verified.', razorpay_payment_id },
    { status: 200, headers: corsHeaders }
  );
}

// -----------------------------------------------------------------------------
// POST /api/orders
// Body: { customer_email, customer_name, customer_phone, shipping_address,
//         items, subtotal, shipping, total,
//         razorpay_order_id, razorpay_payment_id }
// -----------------------------------------------------------------------------
async function handleOrderCreate(request, env, corsHeaders) {
  const body = await parseBody(request);
  const email = (body.customer_email || '').trim().toLowerCase();

  if (!isValidEmail(email)) {
    return Response.json({ error: 'A valid customer_email is required.' }, { status: 400, headers: corsHeaders });
  }

  // Verify the email was verified in this session
  const isVerified = await env.OTP_STORE.get(`verified:${email}`);
  if (!isVerified) {
    return Response.json(
      { error: 'Email address has not been verified. Please complete OTP verification.' },
      { status: 403, headers: corsHeaders }
    );
  }

  // Validate required fields
  if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
    return Response.json({ error: 'Order must contain at least one item.' }, { status: 400, headers: corsHeaders });
  }
  if (!body.total || body.total < 0) {
    return Response.json({ error: 'A valid total (in paise) is required.' }, { status: 400, headers: corsHeaders });
  }

  const orderId = generateOrderId();
  const now     = new Date().toISOString();

  await env.DB.prepare(`
    INSERT INTO orders (
      id, customer_email, customer_name, customer_phone,
      shipping_address, items, subtotal, shipping, total,
      razorpay_order_id, razorpay_payment_id,
      payment_status, order_status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    orderId,
    email,
    body.customer_name   || null,
    body.customer_phone  || null,
    JSON.stringify(body.shipping_address || {}),
    JSON.stringify(body.items),
    body.subtotal || 0,
    body.shipping || 0,
    body.total,
    body.razorpay_order_id   || null,
    body.razorpay_payment_id || null,
    'paid',     // Payment reached this endpoint, so it's paid
    'placed',
    now
  ).run();

  return Response.json(
    { success: true, id: orderId, order_id: orderId, created_at: now },
    { status: 201, headers: corsHeaders }
  );
}

// -----------------------------------------------------------------------------
// GET /api/orders/:id
// -----------------------------------------------------------------------------
async function handleOrderGet(id, env, corsHeaders) {
  if (!id) {
    return Response.json({ error: 'Order ID is required.' }, { status: 400, headers: corsHeaders });
  }

  const row = await env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(id).first();

  if (!row) {
    return Response.json({ error: 'Order not found.' }, { status: 404, headers: corsHeaders });
  }

  // Parse JSON fields before returning
  const order = {
    ...row,
    shipping_address: safeParseJSON(row.shipping_address, {}),
    items: safeParseJSON(row.items, []),
  };

  return Response.json(order, { status: 200, headers: corsHeaders });
}

// -----------------------------------------------------------------------------
// GET /api/products  (optional: ?category=dresses&featured=1&limit=12&offset=0)
// -----------------------------------------------------------------------------
async function handleProductsList(url, env, corsHeaders) {
  const category = url.searchParams.get('category') || null;
  const featured = url.searchParams.get('featured')  || null;
  const limit    = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100);
  const offset   = parseInt(url.searchParams.get('offset') || '0', 10);

  let query  = 'SELECT * FROM products';
  const conditions = [];
  const bindings   = [];

  if (category) {
    conditions.push('category = ?');
    bindings.push(category);
  }
  if (featured !== null) {
    conditions.push('featured = ?');
    bindings.push(featured === '1' ? 1 : 0);
  }
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  bindings.push(limit, offset);

  const stmt   = env.DB.prepare(query);
  const result = await stmt.bind(...bindings).all();

  const products = (result.results || []).map(parseProductRow);

  return Response.json({ products, count: products.length }, { status: 200, headers: corsHeaders });
}

// -----------------------------------------------------------------------------
// GET /api/products/:id
// -----------------------------------------------------------------------------
async function handleProductGet(id, env, corsHeaders) {
  if (!id) {
    return Response.json({ error: 'Product ID is required.' }, { status: 400, headers: corsHeaders });
  }

  const row = await env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(id).first();

  if (!row) {
    return Response.json({ error: 'Product not found.' }, { status: 404, headers: corsHeaders });
  }

  return Response.json(parseProductRow(row), { status: 200, headers: corsHeaders });
}

// =============================================================================
// Helper utilities
// =============================================================================

/**
 * Generates a cryptographically random 6-digit OTP.
 * @returns {string}
 */
function generateOTP() {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return String(100000 + (arr[0] % 900000));
}

/**
 * Generates a human-readable order ID in the format LTE-YYYYMMDD-XXXX.
 * @returns {string}
 */
function generateOrderId() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `LTE-${date}-${rand}`;
}

/**
 * Verifies a Razorpay payment signature using HMAC-SHA256 via the Web Crypto API.
 * @param {string} orderId
 * @param {string} paymentId
 * @param {string} signature   — hex string received from Razorpay
 * @param {string} secret      — Razorpay key secret
 * @returns {Promise<boolean>}
 */
async function verifyRazorpaySignature(orderId, paymentId, signature, secret) {
  const body    = `${orderId}|${paymentId}`;
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signed  = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const hash    = Array.from(new Uint8Array(signed))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return hash === signature;
}

/**
 * Sends the OTP email via MailChannels.
 * @param {string} email
 * @param {string} otp
 * @returns {Promise<boolean>} true if sent successfully
 */
async function sendOTPEmail(email, otp) {
  try {
    const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{ to: [{ email }] }],
        from: { email: 'noreply@narivibe.com', name: "L'ÉTÉ" },
        subject: "Your L'ÉTÉ verification code",
        content: [
          {
            type: 'text/html',
            value: buildOTPEmailHtml(otp),
          },
        ],
      }),
    });
    return response.ok;
  } catch (err) {
    console.error('[MailChannels] Email send error:', err);
    return false;
  }
}

/**
 * Builds the HTML body for the OTP verification email.
 * @param {string} otp
 * @returns {string}
 */
function buildOTPEmailHtml(otp) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>L'ÉTÉ Verification Code</title>
</head>
<body style="margin:0;padding:0;background:#f9f9f9;font-family:Georgia,serif;">
  <div style="max-width:480px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(112,88,91,0.1);">

    <!-- Header -->
    <div style="background:#70585b;padding:32px 40px;text-align:center;">
      <h1 style="margin:0;font-size:28px;font-weight:400;color:#ffffff;letter-spacing:6px;font-family:Georgia,serif;">L'ÉTÉ</h1>
      <p style="margin:4px 0 0;font-size:11px;color:rgba(255,255,255,0.7);letter-spacing:0.2em;font-family:Arial,sans-serif;text-transform:uppercase;">Summer Collection</p>
    </div>

    <!-- Body -->
    <div style="padding:40px;">
      <p style="color:#4f4445;font-size:16px;margin:0 0 8px;font-family:Georgia,serif;">Your verification code</p>
      <p style="color:#807475;font-size:14px;margin:0 0 28px;font-family:Arial,sans-serif;">Use the code below to verify your email and complete your order.</p>

      <!-- OTP Box -->
      <div style="background:#fadadd;border-radius:10px;padding:28px 20px;text-align:center;margin-bottom:28px;">
        <span style="font-size:40px;font-weight:700;color:#70585b;letter-spacing:14px;font-family:Arial,sans-serif;">${otp}</span>
      </div>

      <p style="color:#807475;font-size:13px;margin:0 0 8px;font-family:Arial,sans-serif;">
        This code is valid for <strong>10 minutes</strong>.
      </p>
      <p style="color:#807475;font-size:13px;margin:0;font-family:Arial,sans-serif;">
        If you didn't request this code, please ignore this email — no action is needed.
      </p>
    </div>

    <!-- Footer -->
    <div style="border-top:1px solid #f0e8e8;padding:20px 40px;text-align:center;">
      <p style="color:#b0a0a1;font-size:11px;margin:0;font-family:Arial,sans-serif;letter-spacing:0.1em;">
        © 2024 L'ÉTÉ SUMMER COLLECTIONS · ALL RIGHTS RESERVED
      </p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Parses the JSON request body safely.
 * @param {Request} request
 * @returns {Promise<Object>}
 */
async function parseBody(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

/**
 * Parses a JSON string safely, returning the fallback on error.
 * @param {string} str
 * @param {*} fallback
 * @returns {*}
 */
function safeParseJSON(str, fallback) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

/**
 * Parses a product row from D1, deserialising JSON fields.
 * @param {Object} row
 * @returns {Object}
 */
function parseProductRow(row) {
  return {
    ...row,
    colors:  safeParseJSON(row.colors, []),
    sizes:   safeParseJSON(row.sizes, []),
    details: safeParseJSON(row.details, []),
    images:  safeParseJSON(row.images, []),
    featured: row.featured === 1,
  };
}

/**
 * Validates an email address with a basic regex.
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Builds an array of allowed CORS origins from the env variable,
 * always including localhost variants for developer convenience.
 * @param {string} configuredOrigin
 * @returns {string[]}
 */
function buildAllowedOrigins(configuredOrigin) {
  const origins = new Set([
    'http://localhost:3000',
    'http://localhost:5500',
    'http://localhost:8080',
    'http://127.0.0.1:5500',
    'http://127.0.0.1:8080',
  ]);

  if (configuredOrigin) {
    // Support comma-separated list of origins
    configuredOrigin.split(',').forEach(o => origins.add(o.trim()));
  }

  return [...origins];
}
