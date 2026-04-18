import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import {
  CreateProductInput,
  UpdateProductInput,
  ListProductsQuery,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '../schemas/product.schemas';

export class ProductService {
  // ============================================================================
  // PRODUCTS
  // ============================================================================

  async createProduct(input: CreateProductInput) {
    // Check if SKU already exists
    const existingSku = await prisma.product.findUnique({
      where: { sku: input.sku },
    });

    if (existingSku) {
      throw new AppError(409, `Product with SKU ${input.sku} already exists`);
    }

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: input.categoryId },
    });

    if (!category) {
      throw new AppError(404, 'Category not found');
    }

    // Generate slug from name
    const slug = input.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const product = await prisma.product.create({
      data: {
        sku: input.sku,
        slug,
        name: input.name,
        description: input.description,
        categoryId: input.categoryId,
        price: input.price,
        cost: input.cost,
        stock: input.stock,
        isActive: input.isActive,
        isVisible: input.isVisible,
      },
      include: { category: true },
    });

    return product;
  }

  async getProduct(productId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        images: { orderBy: { order: 'asc' } },
        promotions: { where: { isActive: true } },
      },
    });

    if (!product) {
      throw new AppError(404, 'Product not found');
    }

    return product;
  }

  async updateProduct(productId: string, input: UpdateProductInput) {
    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new AppError(404, 'Product not found');
    }

    // Check category if provided
    if (input.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: input.categoryId },
      });

      if (!category) {
        throw new AppError(404, 'Category not found');
      }
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        ...input,
      },
      include: { category: true },
    });

    return updatedProduct;
  }

  async deleteProduct(productId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new AppError(404, 'Product not found');
    }

    // Soft delete by marking as inactive
    await prisma.product.update({
      where: { id: productId },
      data: { isActive: false },
    });

    return { message: 'Product deleted successfully' };
  }

  async listProducts(query: ListProductsQuery) {
    const {
      page = 1,
      limit = 20,
      search,
      categoryId,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isActive,
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      isActive: isActive !== undefined ? isActive : true,
      isVisible: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) {
        where.price.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        where.price.lte = maxPrice;
      }
    }

    // Get total count
    const total = await prisma.product.count({ where });

    // Get products
    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        images: { where: { isPrimary: true } },
        promotions: { where: { isActive: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    });

    return {
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async searchProducts(searchTerm: string, limit = 10) {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        isVisible: true,
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { sku: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        sku: true,
        name: true,
        price: true,
      },
      take: limit,
    });

    return products;
  }

  // ============================================================================
  // CATEGORIES
  // ============================================================================

  async createCategory(input: CreateCategoryInput) {
    // Generate slug
    const slug = input.name.toLowerCase().replace(/\s+/g, '-');

    // Check if slug already exists
    const existing = await prisma.category.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new AppError(409, 'Category already exists');
    }

    const category = await prisma.category.create({
      data: {
        name: input.name,
        slug,
        description: input.description,
      },
    });

    return category;
  }

  async getCategory(categoryId: string) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: { select: { products: true } },
      },
    });

    if (!category) {
      throw new AppError(404, 'Category not found');
    }

    return category;
  }

  async updateCategory(categoryId: string, input: UpdateCategoryInput) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new AppError(404, 'Category not found');
    }

    const updated = await prisma.category.update({
      where: { id: categoryId },
      data: input,
    });

    return updated;
  }

  async deleteCategory(categoryId: string) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new AppError(404, 'Category not found');
    }

    // Check if category has products
    const productCount = await prisma.product.count({
      where: { categoryId },
    });

    if (productCount > 0) {
      throw new AppError(
        400,
        `Cannot delete category with ${productCount} products. Please move or delete products first.`
      );
    }

    await prisma.category.delete({
      where: { id: categoryId },
    });

    return { message: 'Category deleted successfully' };
  }

  async listCategories() {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { products: { where: { isActive: true, isVisible: true } } } },
      },
      orderBy: { name: 'asc' },
    });

    return categories;
  }
}

export const productService = new ProductService();
