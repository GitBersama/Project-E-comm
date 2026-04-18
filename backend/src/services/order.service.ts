import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import {
  CreateOrderInput,
  UpdateOrderStatusInput,
  CancelOrderInput,
  ListOrdersQuery,
} from '../schemas/order.schemas';

export class OrderService {
  // ============================================================================
  // ORDER CREATION & MANAGEMENT
  // ============================================================================

  async createOrder(customerId: string, input: CreateOrderInput) {
    // Validate shipping address belongs to customer
    const shippingAddress = await prisma.address.findFirst({
      where: {
        id: input.shippingAddressId,
        userId: customerId,
      },
    });

    if (!shippingAddress) {
      throw new AppError(404, 'Shipping address not found');
    }

    // Validate and get products
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: input.items.map((item) => item.productId),
        },
        isActive: true,
      },
    });

    if (products.length !== input.items.length) {
      throw new AppError(400, 'Some products not found or inactive');
    }

    // Calculate order totals
    let subtotal = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const itemsData: any[] = [];

    for (const item of input.items) {
      const product = products.find((p) => p.id === item.productId);

      if (!product) {
        throw new AppError(400, `Product ${item.productId} not found`);
      }

      if (product.stock < item.quantity) {
        throw new AppError(400, `Product ${product.name} has insufficient stock`);
      }

      const itemSubtotal = product.price * item.quantity;
      subtotal += itemSubtotal;

      itemsData.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price,
        subtotal: itemSubtotal,
      });
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId,
        shippingAddressId: input.shippingAddressId,
        status: 'PENDING',
        subtotal,
        shippingCost: 0, // Will be set when customer selects shipping
        tax: 0,
        discount: 0,
        totalAmount: subtotal,
        notes: input.notes,
        items: {
          createMany: {
            data: itemsData,
          },
        },
        events: {
          create: {
            type: 'CREATED' as const,
            message: 'Order created successfully',
          },
        },
      },
      include: { items: { include: { product: true } }, events: true },
    });

    return order;
  }

  async getOrder(orderId: string, userId?: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: { select: { id: true, email: true, name: true } },
        items: { include: { product: true } },
        payment: true,
        shipment: { include: { events: true } },
        events: true,
      },
    });

    if (!order) {
      throw new AppError(404, 'Order not found');
    }

    // Check if customer is accessing their own order (for non-admin users)
    if (userId && order.customerId !== userId) {
      throw new AppError(403, 'You do not have permission to view this order');
    }

    return order;
  }

  async listCustomerOrders(customerId: string, query: ListOrdersQuery) {
    const {
      page = 1,
      limit = 20,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { customerId };

    if (status) {
      where.status = status;
    }

    const total = await prisma.order.count({ where });

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: { include: { product: { select: { name: true, sku: true } } } },
        payment: true,
        shipment: true,
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    });

    return {
      data: orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async listAllOrders(query: ListOrdersQuery) {
    const {
      page = 1,
      limit = 20,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (status) {
      where.status = status;
    }

    const total = await prisma.order.count({ where });

    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: { select: { id: true, email: true, name: true } },
        items: { include: { product: { select: { name: true, sku: true } } } },
        payment: true,
        shipment: true,
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    });

    return {
      data: orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async updateOrderStatus(orderId: string, input: UpdateOrderStatusInput) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new AppError(404, 'Order not found');
    }

    // Map status to OrderEventType (only PAID, CANCELLED, PROCESSING, SHIPPED, DELIVERED, REFUNDED)
    const eventTypeMap: Record<string, 'PAID' | 'CANCELLED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'REFUNDED'> = {
      PAID: 'PAID',
      CANCELLED: 'CANCELLED',
      PROCESSING: 'PROCESSING',
      SHIPPED: 'SHIPPED',
      DELIVERED: 'DELIVERED',
      REFUNDED: 'REFUNDED',
    };

    const eventType = eventTypeMap[input.status];

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: input.status,
        ...(eventType && {
          events: {
            create: {
              type: eventType,
              message: `Order status updated to ${input.status}`,
            },
          },
        }),
      },
      include: { items: true, events: true },
    });

    return updatedOrder;
  }

  async cancelOrder(orderId: string, input: CancelOrderInput, userId?: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new AppError(404, 'Order not found');
    }

    // Check if customer is cancelling their own order
    if (userId && order.customerId !== userId) {
      throw new AppError(403, 'You do not have permission to cancel this order');
    }

    // Can only cancel PENDING or PROCESSING orders
    if (!['PENDING', 'PROCESSING'].includes(order.status)) {
      throw new AppError(400, `Cannot cancel order with status ${order.status}`);
    }

    const cancelledOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        events: {
          create: {
            type: 'CANCELLED' as const,
            message: input.reason || 'Order cancelled',
          },
        },
      },
      include: { items: true },
    });

    return cancelledOrder;
  }

  // ============================================================================
  // STATISTICS & REPORTING
  // ============================================================================

  async getTodayOrdersSummary() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const stats = await prisma.order.aggregate({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      _count: true,
      _sum: { totalAmount: true },
    });

    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      select: { id: true, status: true, totalAmount: true },
    });

    return {
      totalOrders: stats._count,
      totalRevenue: stats._sum.totalAmount || 0,
      orders: orders,
    };
  }

  async getOrdersByStatus() {
    const statuses = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];

    const result = await Promise.all(
      statuses.map(async (status) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const count = await prisma.order.count({ where: { status: status as any } });
        return { status, count };
      })
    );

    return result;
  }
}

export const orderService = new OrderService();
