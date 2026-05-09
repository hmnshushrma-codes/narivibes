import { parseProductRow } from '../utils/helpers.js';

export async function findActive(db, { category, featured, limit, offset }) {
  const conditions = ['(status = ? OR status IS NULL)'];
  const bindings = ['active'];

  if (category) { conditions.push('category = ?'); bindings.push(category); }
  if (featured !== null && featured !== undefined) {
    conditions.push('featured = ?');
    bindings.push(featured === '1' ? 1 : 0);
  }

  const query = `SELECT * FROM products WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  bindings.push(limit, offset);

  const result = await db.prepare(query).bind(...bindings).all();
  return (result.results || []).map(parseProductRow);
}

export async function findById(db, id) {
  const row = await db.prepare('SELECT * FROM products WHERE id = ?').bind(id).first();
  if (!row) return null;
  return parseProductRow(row);
}

export async function findAll(db, { limit, offset }) {
  const result = await db.prepare('SELECT * FROM products ORDER BY name ASC LIMIT ? OFFSET ?').bind(limit, offset).all();
  return (result.results || []).map(parseProductRow);
}

export async function update(db, id, fields) {
  const existing = await db.prepare('SELECT id FROM products WHERE id = ?').bind(id).first();
  if (!existing) return null;

  const updates = [];
  const bindings = [];

  if (fields.status !== undefined) {
    updates.push('status = ?'); bindings.push(fields.status);
  }
  if (fields.stock !== undefined) {
    updates.push('stock = ?'); bindings.push(parseInt(fields.stock, 10));
  }
  if (fields.badge !== undefined) {
    updates.push('badge = ?'); bindings.push(fields.badge || null);
  }
  if (fields.featured !== undefined) {
    updates.push('featured = ?'); bindings.push(fields.featured ? 1 : 0);
  }

  if (updates.length === 0) return { noUpdates: true };

  bindings.push(id);
  await db.prepare(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`).bind(...bindings).run();
  return findById(db, id);
}
