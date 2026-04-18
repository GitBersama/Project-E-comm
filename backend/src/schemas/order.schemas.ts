import { z } from 'zod';

// Create Order
export const createOrderSchema = z.object({
  body: z.object({
    items: z.array(
      z.object({
        productId: z.string().cuid('Invalid product ID'),
        quantity: z.number().int().positive('Quantity must be greater than 0'),
      })
    ).min(1, 'Order must have at least 1 item'),
    shippingAddressId: z.string().cuid('Invalid address ID'),
    notes: z.string().optional(),
  }),
});

// Update Order Status
export const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum(['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']),
  }),
});

// Cancel Order
export const cancelOrderSchema = z.object({
  body: z.object({
    reason: z.string().optional(),
  }),
});

// List Orders with Filters
export const listOrdersSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/, 'Page must be a number').transform(Number).default('1'),
    limit: z.string().regex(/^\d+$/, 'Limit must be a number').transform(Number).default('20'),
    status: z.enum(['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']).optional(),
    sortBy: z.enum(['createdAt', 'totalAmount']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
});

// Get Shipping Cost Estimate
export const estimateShippingSchema = z.object({
  body: z.object({
    destinationCity: z.string().min(1, 'Destination city is required'),
    weight: z.number().positive('Weight must be greater than 0').optional(),
  }),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>['body'];
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>['body'];
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>['body'];
export type ListOrdersQuery = z.infer<typeof listOrdersSchema>['query'];
export type EstimateShippingInput = z.infer<typeof estimateShippingSchema>['body'];
