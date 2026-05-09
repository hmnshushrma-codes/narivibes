import { parseBody, isValidEmail } from '../utils/helpers.js';
import * as OrderModel from '../models/order.model.js';

export async function create({ request, env, corsHeaders }) {
  const body = await parseBody(request);
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

  const order = await OrderModel.create(env.DB, { ...body, customer_email: email });
  return Response.json({ success: true, id: order.id, order_id: order.id, created_at: order.created_at }, { status: 201, headers: corsHeaders });
}

export async function getById({ params, env, corsHeaders }) {
  const order = await OrderModel.findById(env.DB, params.id);
  if (!order) return Response.json({ error: 'Order not found.' }, { status: 404, headers: corsHeaders });
  return Response.json(order, { status: 200, headers: corsHeaders });
}
