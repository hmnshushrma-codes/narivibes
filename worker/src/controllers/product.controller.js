import * as ProductModel from '../models/product.model.js';

export async function list({ url, env, corsHeaders }) {
  const category = url.searchParams.get('category') || null;
  const featured = url.searchParams.get('featured') || null;
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);

  const products = await ProductModel.findActive(env.DB, { category, featured, limit, offset });
  return Response.json({ products, count: products.length }, { status: 200, headers: corsHeaders });
}

export async function getById({ params, env, corsHeaders }) {
  const product = await ProductModel.findById(env.DB, params.id);
  if (!product) return Response.json({ error: 'Product not found.' }, { status: 404, headers: corsHeaders });
  return Response.json(product, { status: 200, headers: corsHeaders });
}
