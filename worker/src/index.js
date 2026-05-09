/**
 * L'ÉTÉ — NariVibes Brand
 * Cloudflare Worker — Main Entry Point
 *
 * Handles CORS, error boundary, and dispatches to the router.
 * All route definitions live in routes.js.
 */

import { buildCorsHeaders, handlePreflight } from './middleware/cors.js';
import { registerRoutes } from './routes.js';

const router = registerRoutes();

export default {
  async fetch(request, env, ctx) {
    const corsHeaders = buildCorsHeaders(request, env);

    if (request.method === 'OPTIONS') {
      return handlePreflight(corsHeaders);
    }

    const url = new URL(request.url);
    const match = router.match(request.method, url.pathname);

    if (!match) {
      return Response.json({ error: 'Not found' }, { status: 404, headers: corsHeaders });
    }

    try {
      return await match.handler({ request, env, ctx, url, params: match.params, corsHeaders });
    } catch (err) {
      console.error('[Worker] Unhandled error:', err);
      return Response.json(
        { error: 'Internal server error', detail: err.message },
        { status: 500, headers: corsHeaders }
      );
    }
  }
};
