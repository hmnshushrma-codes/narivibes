import { Router } from './router.js';
import * as otpController from './controllers/otp.controller.js';
import * as paymentController from './controllers/payment.controller.js';
import * as orderController from './controllers/order.controller.js';
import * as productController from './controllers/product.controller.js';
import * as adminController from './controllers/admin.controller.js';

export function registerRoutes() {
  const router = new Router();

  // ── Public ────────────────────────────────────────────────
  router.post('/api/otp/send',        otpController.send);
  router.post('/api/otp/verify',      otpController.verify);
  router.post('/api/payment/create',  paymentController.create);
  router.post('/api/payment/verify',  paymentController.verify);
  router.post('/api/orders',          orderController.create);
  router.get('/api/orders/:id',       orderController.getById);
  router.get('/api/products',         productController.list);
  router.get('/api/products/:id',     productController.getById);

  // ── Admin ─────────────────────────────────────────────────
  router.post('/api/admin/request-otp',    adminController.requestOtp);
  router.post('/api/admin/verify-otp',     adminController.verifyOtp);
  router.post('/api/admin/logout',         adminController.logout);
  router.get('/api/admin/orders',          adminController.listOrders);
  router.patch('/api/admin/orders/:id',    adminController.patchOrder);
  router.get('/api/admin/products',        adminController.listProducts);
  router.patch('/api/admin/products/:id',  adminController.patchProduct);

  // ── Health ────────────────────────────────────────────────
  router.get('/api/health', async ({ corsHeaders }) => {
    return Response.json({ status: 'ok', ts: new Date().toISOString() }, { headers: corsHeaders });
  });

  return router;
}
