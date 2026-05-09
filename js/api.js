/**
 * NariVibes — Product API Module
 * Loads products from the Cloudflare Worker / D1 database.
 * Falls back to the static PRODUCTS array (products.js) on network error.
 */

var NariVibesAPI = (function () {
  'use strict';

  var API_BASE = 'https://narivibe-worker.hmnshu26.workers.dev';
  var _cache   = null;
  var _promise = null;

  // ---------------------------------------------------------------------------
  // Normalise a product row from the API into the same shape as products.js
  // ---------------------------------------------------------------------------
  function normalize(p) {
    var price = Number(p.price) || 0;
    return {
      id:           p.id,
      name:         p.name         || '',
      material:     p.material     || '',
      price:        price,
      priceDisplay: p.priceDisplay || ('\u20B9' + price.toLocaleString('en-IN')),
      category:     p.category     || '',
      collection:   p.collection   || '',
      colors:       Array.isArray(p.colors)  ? p.colors  : [],
      sizes:        Array.isArray(p.sizes)   ? p.sizes   : [],
      details:      Array.isArray(p.details) ? p.details : [],
      images:       Array.isArray(p.images)  ? p.images  : [],
      description:  p.description  || '',
      stock:        Number(p.stock) || 0,
      featured:     p.featured === true || p.featured === 1,
      badge:        p.badge || undefined,
      status:       p.status || 'active',
    };
  }

  // ---------------------------------------------------------------------------
  // Public: loadProducts() → Promise<Product[]>
  // Results are memory-cached after the first successful fetch.
  // ---------------------------------------------------------------------------
  function loadProducts() {
    if (_cache)   return Promise.resolve(_cache);
    if (_promise) return _promise;

    _promise = fetch(API_BASE + '/api/products?limit=100')
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        _cache = (data.products || []).map(normalize);
        console.info('[NariVibesAPI] Loaded ' + _cache.length + ' products from DB');
        return _cache;
      })
      .catch(function (err) {
        console.warn('[NariVibesAPI] Falling back to static catalog:', err.message);
        // Use the bundled products.js array as a fallback
        _cache = (typeof PRODUCTS !== 'undefined' ? PRODUCTS : []).map(normalize);
        return _cache;
      });

    return _promise;
  }

  return { loadProducts: loadProducts };
}());
