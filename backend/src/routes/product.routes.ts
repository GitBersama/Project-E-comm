import { Router } from 'express';
import { productController } from '../controllers/product.controller';
import { validateBody, validateRequest } from '../middleware/validation';
import { authMiddleware, optionalAuth } from '../middleware/auth';
import { checkRole } from '../middleware/rbac';
import {
  createProductSchema,
  updateProductSchema,
  listProductsSchema,
  createCategorySchema,
  updateCategorySchema,
} from '../schemas/product.schemas';

const router = Router();

// ============================================================================
// PRODUCTS - PUBLIC ROUTES
// ============================================================================

// List products (public)
router.get(
  '/',
  optionalAuth,
  validateRequest(listProductsSchema),
  productController.listProducts
);

// Get product detail (public)
router.get('/:id', optionalAuth, productController.getProduct);

// Search products (public)
router.get('/search/query', optionalAuth, productController.searchProducts);

// ============================================================================
// PRODUCTS - PROTECTED ROUTES (MANAGER/SUPER_ADMIN ONLY)
// ============================================================================

// Create product
router.post(
  '/',
  authMiddleware,
  checkRole(['MANAGER', 'SUPER_ADMIN']),
  validateBody(createProductSchema.shape.body),
  productController.createProduct
);

// Update product
router.put(
  '/:id',
  authMiddleware,
  checkRole(['MANAGER', 'SUPER_ADMIN']),
  validateBody(updateProductSchema.shape.body),
  productController.updateProduct
);

// Delete product
router.delete(
  '/:id',
  authMiddleware,
  checkRole(['MANAGER', 'SUPER_ADMIN']),
  productController.deleteProduct
);

// ============================================================================
// CATEGORIES - PUBLIC ROUTES
// ============================================================================

// List categories (public)
router.get(
  '/categories',
  optionalAuth,
  productController.listCategories
);

// Get category detail (public, intentionally not at categories/:id to avoid conflict)
router.get(
  '/categories/:id',
  optionalAuth,
  productController.getCategory
);

// ============================================================================
// CATEGORIES - PROTECTED ROUTES (MANAGER/SUPER_ADMIN ONLY)
// ============================================================================

// Create category
router.post(
  '/categories',
  authMiddleware,
  checkRole(['MANAGER', 'SUPER_ADMIN']),
  validateBody(createCategorySchema.shape.body),
  productController.createCategory
);

// Update category
router.put(
  '/categories/:id',
  authMiddleware,
  checkRole(['MANAGER', 'SUPER_ADMIN']),
  validateBody(updateCategorySchema.shape.body),
  productController.updateCategory
);

// Delete category
router.delete(
  '/categories/:id',
  authMiddleware,
  checkRole(['MANAGER', 'SUPER_ADMIN']),
  productController.deleteCategory
);

export default router;
