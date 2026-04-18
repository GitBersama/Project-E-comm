import { Request, Response } from 'express';
import { productService } from '../services/product.service';
import { asyncHandler } from '../middleware/errorHandler';
import {
  CreateProductInput,
  UpdateProductInput,
  ListProductsQuery,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '../schemas/product.schemas';

export class ProductController {
  // ============================================================================
  // PRODUCTS
  // ============================================================================

  createProduct = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const input = req.body as CreateProductInput;
    const product = await productService.createProduct(input);

    res.status(201).json({
      status: 'success',
      statusCode: 201,
      message: 'Product created successfully',
      data: product,
    });
  });

  getProduct = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const product = await productService.getProduct(id);

    res.status(200).json({
      status: 'success',
      statusCode: 200,
      data: product,
    });
  });

  updateProduct = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const input = req.body as UpdateProductInput;
    const product = await productService.updateProduct(id, input);

    res.status(200).json({
      status: 'success',
      statusCode: 200,
      message: 'Product updated successfully',
      data: product,
    });
  });

  deleteProduct = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const result = await productService.deleteProduct(id);

    res.status(200).json({
      status: 'success',
      statusCode: 200,
      message: result.message,
    });
  });

  listProducts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const query = req.query as unknown as ListProductsQuery;
    const result = await productService.listProducts(query);

    res.status(200).json({
      status: 'success',
      statusCode: 200,
      data: result.data,
      pagination: result.pagination,
    });
  });

  searchProducts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { q, limit } = req.query;

    if (!q || typeof q !== 'string') {
      res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: 'Search query (q) is required',
      });
      return;
    }

    const limitNum = limit ? parseInt(limit as string, 10) : 10;
    const results = await productService.searchProducts(q, limitNum);

    res.status(200).json({
      status: 'success',
      statusCode: 200,
      data: results,
    });
  });

  // ============================================================================
  // CATEGORIES
  // ============================================================================

  createCategory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const input = req.body as CreateCategoryInput;
    const category = await productService.createCategory(input);

    res.status(201).json({
      status: 'success',
      statusCode: 201,
      message: 'Category created successfully',
      data: category,
    });
  });

  getCategory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const category = await productService.getCategory(id);

    res.status(200).json({
      status: 'success',
      statusCode: 200,
      data: category,
    });
  });

  updateCategory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const input = req.body as UpdateCategoryInput;
    const category = await productService.updateCategory(id, input);

    res.status(200).json({
      status: 'success',
      statusCode: 200,
      message: 'Category updated successfully',
      data: category,
    });
  });

  deleteCategory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const result = await productService.deleteCategory(id);

    res.status(200).json({
      status: 'success',
      statusCode: 200,
      message: result.message,
    });
  });

  listCategories = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const categories = await productService.listCategories();

    res.status(200).json({
      status: 'success',
      statusCode: 200,
      data: categories,
    });
  });
}

export const productController = new ProductController();
