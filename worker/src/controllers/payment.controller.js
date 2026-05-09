import { parseBody } from '../utils/helpers.js';
import { checkRateLimit } from '../utils/rate-limit.js';
import * as razorpay from '../services/razorpay.service.js';

export async function create({ request, env, corsHeaders }) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const rl = await checkRateLimit(ip, 'payment_create', 5, 60, env);
  if (rl.limited) {
    return Response.json(
      { error: 'Too many payment requests. Please wait a moment.' },
      { status: 429, headers: { ...corsHeaders, 'Retry-After': '60' } }
    );
  }

  const body = await parseBody(request);
  const amount = parseInt(body.amount, 10);

  if (!amount || amount < 100) {
    return Response.json({ error: 'Valid amount (paise, min 100) required.' }, { status: 400, headers: corsHeaders });
  }

  try {
    const order = await razorpay.createOrder(amount, body.currency, env);
    return Response.json(
      { razorpay_order_id: order.id, amount: order.amount, currency: order.currency },
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    return Response.json({ error: 'Failed to create payment order.', detail: err.message }, { status: 502, headers: corsHeaders });
  }
}

export async function verify({ request, env, corsHeaders }) {
  const body = await parseBody(request);
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return Response.json(
      { error: 'razorpay_order_id, razorpay_payment_id, razorpay_signature all required.' },
      { status: 400, headers: corsHeaders }
    );
  }

  const valid = await razorpay.verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature, env.RAZORPAY_KEY_SECRET);
  if (!valid) {
    return Response.json({ error: 'Payment signature verification failed.' }, { status: 400, headers: corsHeaders });
  }

  return Response.json({ success: true, message: 'Payment verified.', razorpay_payment_id }, { status: 200, headers: corsHeaders });
}
