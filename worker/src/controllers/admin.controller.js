import { parseBody, isValidEmail, generateOTP } from '../utils/helpers.js';
import { checkRateLimit } from '../utils/rate-limit.js';
import { requireAdmin } from '../middleware/auth.js';
import { sendAdminOTPEmail } from '../services/email.service.js';
import * as OrderModel from '../models/order.model.js';
import * as ProductModel from '../models/product.model.js';

// POST /api/admin/request-otp
export async function requestOtp({ request, env, corsHeaders }) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const rl = await checkRateLimit(ip, 'admin_otp', 5, 900, env);
  if (rl.limited) {
    return Response.json(
      { error: 'Too many login attempts. Please wait 15 minutes.' },
      { status: 429, headers: { ...corsHeaders, 'Retry-After': '900' } }
    );
  }

  const body = await parseBody(request);
  const email = (body.email || '').trim().toLowerCase();
  const secret = (body.adminSecret || '').trim();

  if (!isValidEmail(email)) {
    return Response.json({ error: 'A valid email is required.' }, { status: 400, headers: corsHeaders });
  }

  const allowed = (env.ALLOWED_ADMIN_EMAIL || '')
    .split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
  if (!allowed.includes(email)) {
    return Response.json({ error: 'Invalid credentials.' }, { status: 401, headers: corsHeaders });
  }

  if (!env.ADMIN_SECRET || secret !== env.ADMIN_SECRET) {
    return Response.json({ error: 'Invalid credentials.' }, { status: 401, headers: corsHeaders });
  }

  const otp = generateOTP();
  await env.OTP_STORE.put(`admin_otp:${email}`, otp, { expirationTtl: 600 });

  const emailSent = await sendAdminOTPEmail(email, otp, env);
  const payload = { success: true, message: 'Admin OTP sent.' };
  if (!emailSent || env.ENVIRONMENT === 'development') {
    payload.otp = otp;
    payload.note = 'OTP exposed (dev mode or email delivery issue).';
  }
  return Response.json(payload, { status: 200, headers: corsHeaders });
}

// POST /api/admin/verify-otp
export async function verifyOtp({ request, env, corsHeaders }) {
  const body = await parseBody(request);
  const email = (body.email || '').trim().toLowerCase();
  const otp = (body.otp || '').trim();

  if (!isValidEmail(email) || !/^\d{6}$/.test(otp)) {
    return Response.json({ error: 'Valid email and 6-digit OTP required.' }, { status: 400, headers: corsHeaders });
  }

  const stored = await env.OTP_STORE.get(`admin_otp:${email}`);
  if (!stored || stored !== otp) {
    return Response.json({ error: 'Invalid or expired OTP.' }, { status: 401, headers: corsHeaders });
  }

  await env.OTP_STORE.delete(`admin_otp:${email}`);

  const token = crypto.randomUUID();
  const session = JSON.stringify({ email, createdAt: new Date().toISOString() });
  await env.OTP_STORE.put(`admin_session:${token}`, session, { expirationTtl: 28800 });

  return Response.json({ success: true, token, email }, { status: 200, headers: corsHeaders });
}

// POST /api/admin/logout
export async function logout({ request, env, corsHeaders }) {
  const session = await requireAdmin(request, env);
  if (session) {
    const token = (request.headers.get('Authorization') || '').slice(7).trim();
    await env.OTP_STORE.delete(`admin_session:${token}`);
  }
  return Response.json({ success: true }, { status: 200, headers: corsHeaders });
}

// GET /api/admin/orders
export async function listOrders({ request, url, env, corsHeaders }) {
  const session = await requireAdmin(request, env);
  if (!session) return Response.json({ error: 'Unauthorized.' }, { status: 401, headers: corsHeaders });

  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100);
  const offset = (page - 1) * limit;
  const status = url.searchParams.get('status') || null;

  const [orders, total] = await Promise.all([
    OrderModel.findAll(env.DB, { status, limit, offset }),
    OrderModel.count(env.DB, { status }),
  ]);

  return Response.json({
    orders, total, page, limit,
    pages: Math.ceil(total / limit),
  }, { status: 200, headers: corsHeaders });
}

// PATCH /api/admin/orders/:id
export async function patchOrder({ params, request, env, corsHeaders }) {
  const session = await requireAdmin(request, env);
  if (!session) return Response.json({ error: 'Unauthorized.' }, { status: 401, headers: corsHeaders });

  const body = await parseBody(request);
  const validStatuses = ['placed', 'processing', 'shipped', 'delivered', 'cancelled'];

  if (!body.order_status || !validStatuses.includes(body.order_status)) {
    return Response.json({ error: `order_status must be one of: ${validStatuses.join(', ')}` }, { status: 400, headers: corsHeaders });
  }

  const updated = await OrderModel.updateStatus(env.DB, params.id, body.order_status);
  if (!updated) return Response.json({ error: 'Order not found.' }, { status: 404, headers: corsHeaders });

  return Response.json(updated, { status: 200, headers: corsHeaders });
}

// GET /api/admin/products
export async function listProducts({ request, url, env, corsHeaders }) {
  const session = await requireAdmin(request, env);
  if (!session) return Response.json({ error: 'Unauthorized.' }, { status: 401, headers: corsHeaders });

  const limit = Math.min(parseInt(url.searchParams.get('limit') || '200', 10), 500);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);

  const products = await ProductModel.findAll(env.DB, { limit, offset });
  return Response.json({ products, count: products.length }, { status: 200, headers: corsHeaders });
}

// PATCH /api/admin/products/:id
export async function patchProduct({ params, request, env, corsHeaders }) {
  const session = await requireAdmin(request, env);
  if (!session) return Response.json({ error: 'Unauthorized.' }, { status: 401, headers: corsHeaders });

  const body = await parseBody(request);

  const validStatuses = ['active', 'hidden', 'discontinued'];
  if (body.status !== undefined && !validStatuses.includes(body.status)) {
    return Response.json({ error: `status must be one of: ${validStatuses.join(', ')}` }, { status: 400, headers: corsHeaders });
  }
  if (body.stock !== undefined) {
    const stock = parseInt(body.stock, 10);
    if (isNaN(stock) || stock < 0) {
      return Response.json({ error: 'stock must be a non-negative integer.' }, { status: 400, headers: corsHeaders });
    }
  }

  const updated = await ProductModel.update(env.DB, params.id, body);
  if (!updated) return Response.json({ error: 'Product not found.' }, { status: 404, headers: corsHeaders });
  if (updated.noUpdates) {
    return Response.json({ error: 'No updatable fields provided (status, stock, badge, featured).' }, { status: 400, headers: corsHeaders });
  }

  return Response.json(updated, { status: 200, headers: corsHeaders });
}
