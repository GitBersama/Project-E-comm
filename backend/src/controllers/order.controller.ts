import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { orderService } from '../services/order.service';
import {
  CreateOrderInput,
  UpdateOrderStatusInput,
  CancelOrderInput,
  ListOrdersQuery,
} from '../schemas/order.schemas';

export class OrderController {
  createOrder = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const customerId = req.user?.id as string;
    const input = req.body as CreateOrderInput;

    const order = await orderService.createOrder(customerId, input);

    res.status(201).json({
      status: 'success',
      statusCode: 201,
      message: 'Order created successfully',
      data: order,
    });
  });

  getOrder = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { orderId } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // Admins can view any order, customers can only view their own
    const order = await orderService.getOrder(orderId, userRole === 'CUSTOMER' ? userId : undefined);

    res.status(200).json({
      status: 'success',
      statusCode: 200,
      message: 'Order retrieved successfully',
      data: order,
    });
  });

  listMyOrders = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const customerId = req.user?.id as string;
    const query = req.query as unknown as ListOrdersQuery;

    const result = await orderService.listCustomerOrders(customerId, query);

    res.status(200).json({
      status: 'success',
      statusCode: 200,
      message: 'Customer orders retrieved successfully',
      data: result.data,
      pagination: result.pagination,
    });
  });

  listAllOrders = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const query = req.query as unknown as ListOrdersQuery;

    const result = await orderService.listAllOrders(query);

    res.status(200).json({
      status: 'success',
      statusCode: 200,
      message: 'All orders retrieved successfully',
      data: result.data,
      pagination: result.pagination,
    });
  });

  updateOrderStatus = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { orderId } = req.params;
    const input = req.body as UpdateOrderStatusInput;

    const order = await orderService.updateOrderStatus(orderId, input);

    res.status(200).json({
      status: 'success',
      statusCode: 200,
      message: 'Order status updated successfully',
      data: order,
    });
  });

  cancelOrder = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { orderId } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const input = req.body as CancelOrderInput;

    // Customers can only cancel their own orders, admins can cancel any
    const order = await orderService.cancelOrder(
      orderId,
      input,
      userRole === 'CUSTOMER' ? userId : undefined
    );

    res.status(200).json({
      status: 'success',
      statusCode: 200,
      message: 'Order cancelled successfully',
      data: order,
    });
  });

  getTodaysSummary = asyncHandler(async (_req: Request, res: Response, _next: NextFunction) => {
    const summary = await orderService.getTodayOrdersSummary();

    res.status(200).json({
      status: 'success',
      statusCode: 200,
      message: "Today's order summary retrieved successfully",
      data: summary,
    });
  });

  getOrdersByStatus = asyncHandler(async (_req: Request, res: Response, _next: NextFunction) => {
    const data = await orderService.getOrdersByStatus();

    res.status(200).json({
      status: 'success',
      statusCode: 200,
      message: 'Order statistics retrieved successfully',
      data,
    });
  });
}

export const orderController = new OrderController();
