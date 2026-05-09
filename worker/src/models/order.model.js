import { safeParseJSON, generateOrderId } from '../utils/helpers.js';

export async function create(db, data) {
  const id = generateOrderId();
  const now = new Date().toISOString();

  await db.prepare(`
    INSERT INTO orders (
      id, customer_email, customer_name, customer_phone,
      shipping_address, items, subtotal, shipping, total,
      razorpay_order_id, razorpay_payment_id,
      payment_status, order_status, created_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).bind(
    id, data.customer_email,
    data.customer_name || null,
    data.customer_phone || null,
    JSON.stringify(data.shipping_address || {}),
    JSON.stringify(data.items),
    data.subtotal || 0, data.shipping || 0, data.total,
    data.razorpay_order_id || null,
    data.razorpay_payment_id || null,
    'paid', 'placed', now
  ).run();

  return { id, created_at: now };
}

export async function findById(db, id) {
  const row = await db.prepare('SELECT * FROM orders WHERE id = ?').bind(id).first();
  if (!row) return null;
  return {
    ...row,
    shipping_address: safeParseJSON(row.shipping_address, {}),
    items: safeParseJSON(row.items, []),
  };
}

export async function findAll(db, { status, limit, offset }) {
  const conditions = [];
  const bindings = [];
  if (status) { conditions.push('order_status = ?'); bindings.push(status); }

  const where = conditions.length ? ' WHERE ' + conditions.join(' AND ') : '';
  const query = `SELECT * FROM orders${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`;

  const result = await db.prepare(query).bind(...bindings, limit, offset).all();
  return (result.results || []).map(row => ({
    ...row,
    shipping_address: safeParseJSON(row.shipping_address, {}),
    items: safeParseJSON(row.items, []),
  }));
}

export async function count(db, { status }) {
  const conditions = [];
  const bindings = [];
  if (status) { conditions.push('order_status = ?'); bindings.push(status); }

  const where = conditions.length ? ' WHERE ' + conditions.join(' AND ') : '';
  const row = await db.prepare(`SELECT COUNT(*) as total FROM orders${where}`).bind(...bindings).first();
  return row?.total || 0;
}

export async function updateStatus(db, id, orderStatus) {
  const existing = await db.prepare('SELECT id FROM orders WHERE id = ?').bind(id).first();
  if (!existing) return null;

  await db.prepare('UPDATE orders SET order_status = ? WHERE id = ?').bind(orderStatus, id).run();
  return findById(db, id);
}
