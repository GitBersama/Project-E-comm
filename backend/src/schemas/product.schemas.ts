import { z } from 'zod';

// Create Product
export const createProductSchema = z.object({
  body: z.object({
    sku: z.string().min(1, 'SKU is required').toUpperCase(),
    name: z.string().min(3, 'Product name must be at least 3 characters'),
    description: z.string().optional(),
    categoryId: z.string().cuid('Invalid category ID'),
    price: z.number().positive('Price must be greater than 0'),
    cost: z.number().positive('Cost must be greater than 0').optional(),
    stock: z.number().int().min(0, 'Stock cannot be negative').default(0),
    isActive: z.boolean().default(true),
    isVisible: z.boolean().default(true),
  }),
});

// Update Product
export const updateProductSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Product name must be at least 3 characters').optional(),
    description: z.string().optional(),
    categoryId: z.string().cuid('Invalid category ID').optional(),
    price: z.number().positive('Price must be greater than 0').optional(),
    cost: z.number().positive('Cost must be greater than 0').optional(),
    stock: z.number().int().min(0, 'Stock cannot be negative').optional(),
    isActive: z.boolean().optional(),
    isVisible: z.boolean().optional(),
  }),
});

// List Products with Filters
export const listProductsSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/, 'Page must be a number').transform(Number).default('1'),
    limit: z.string().regex(/^\d+$/, 'Limit must be a number').transform(Number).default('20'),
    search: z.string().optional(),
    categoryId: z.string().optional(),
    minPrice: z.string().regex(/^\d+$/, 'Min price must be a number').transform(Number).optional(),
    maxPrice: z.string().regex(/^\d+$/, 'Max price must be a number').transform(Number).optional(),
    sortBy: z.enum(['createdAt', 'name', 'price', 'popularity']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    isActive: z.string().transform((val) => val === 'true').optional(),
  }),
});

// Create Category
export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Category name must be at least 2 characters'),
    description: z.string().optional(),
  }),
});

// Update Category
export const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Category name must be at least 2 characters').optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export type CreateProductInput = z.infer<typeof createProductSchema>['body'];
export type UpdateProductInput = z.infer<typeof updateProductSchema>['body'];
export type ListProductsQuery = z.infer<typeof listProductsSchema>['query'];
export type CreateCategoryInput = z.infer<typeof createCategorySchema>['body'];
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>['body'];
