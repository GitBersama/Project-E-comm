import { Router } from 'express';
import { orderController } from '../controllers/order.controller';
import { authMiddleware } from '../middleware/auth';
import { checkRole } from '../middleware/rbac';
import { validateRequest } from '../middleware/validation';
import {
  createOrderSchema,
  updateOrderStatusSchema,
  cancelOrderSchema,
} from '../schemas/order.schemas';

const router = Router();

// ============================================================================
// PUBLIC STATISTICS (MANAGER/SUPER_ADMIN ONLY)
// ============================================================================

router.get(
  '/stats/today',
  authMiddleware,
  checkRole(['MANAGER', 'SUPER_ADMIN']),
  orderController.getTodaysSummary
);

router.get(
  '/stats/by-status',
  authMiddleware,
  checkRole(['MANAGER', 'SUPER_ADMIN']),
  orderController.getOrdersByStatus
);

// ============================================================================
// ORDER MANAGEMENT (ALL USERS)
// ============================================================================

/**
 * GET /api/orders
 * List all orders (admins) or customer's orders
 * - Admins: GET /api/orders (all orders)
 * - Customers: GET /api/orders/my (their orders)
 */
router.get('/', authMiddleware, checkRole(['MANAGER', 'SUPER_ADMIN']), orderController.listAllOrders);

/**
 * GET /api/orders/my
 * List authenticated customer's orders
 * Auth Required: Yes
 */
router.get('/my', authMiddleware, orderController.listMyOrders);

/**
 * GET /api/orders/:orderId
 * Get specific order details
 * Auth Required: Yes
 * - Customers: can only view their own orders
 * - Admins: can view any order
 */
router.get('/:orderId', authMiddleware, orderController.getOrder);

/**
 * POST /api/orders
 * Create new order
 * Auth Required: Yes (CUSTOMER role)
 * Body:
 *   - items: { productId, quantity }[]
 *   - shippingAddressId: string
 *   - notes?: string
 */
router.post(
  '/',
  authMiddleware,
  checkRole(['CUSTOMER']),
  validateRequest(createOrderSchema),
  orderController.createOrder
);

/**
 * PUT /api/orders/:orderId/status
 * Update order status (MANAGER/SUPER_ADMIN only)
 * Body:
 *   - status: PENDING | PAID | PROCESSING | SHIPPED | DELIVERED | CANCELLED | REFUNDED
 */
router.put(
  '/:orderId/status',
  authMiddleware,
  checkRole(['MANAGER', 'SUPER_ADMIN']),
  validateRequest(updateOrderStatusSchema),
  orderController.updateOrderStatus
);

/**
 * POST /api/orders/:orderId/cancel
 * Cancel an order (customer can cancel their own, admins can cancel any)
 * Body:
 *   - reason?: string
 */
router.post(
  '/:orderId/cancel',
  authMiddleware,
  validateRequest(cancelOrderSchema),
  orderController.cancelOrder
);

export default router;
