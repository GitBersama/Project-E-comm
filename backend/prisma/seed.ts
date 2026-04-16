import { PrismaClient, UserRole, UserStatus, OrderStatus, PaymentStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.user.deleteMany();
  await prisma.category.deleteMany();
  await prisma.testimonial.deleteMany();
  await prisma.kurirTokoConfiguration.deleteMany();

  // Create categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronic devices and gadgets',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Fashion',
        slug: 'fashion',
        description: 'Clothing, shoes, and accessories',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Home & Living',
        slug: 'home-living',
        description: 'Home and living products',
      },
    }),
  ]);

  console.log(`✓ Created ${categories.length} categories`);

  // Create users
  const superAdmin = await prisma.user.create({
    data: {
      email: 'superadmin@ecommerce.com',
      password: 'hashed_password_here', // Should be hashed with bcrypt
      name: 'Super Admin',
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: 'manager@ecommerce.com',
      password: 'hashed_password_here',
      name: 'Store Manager',
      role: UserRole.MANAGER,
      status: UserStatus.ACTIVE,
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: 'admin@ecommerce.com',
      password: 'hashed_password_here',
      name: 'Admin',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  const customer = await prisma.user.create({
    data: {
      email: 'customer@example.com',
      password: 'hashed_password_here',
      name: 'John Doe',
      phone: '08123456789',
      role: UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
      addresses: {
        create: [
          {
            label: 'Home',
            street: 'Jl. Merdeka No. 123',
            city: 'Jakarta',
            province: 'DKI Jakarta',
            zipCode: '12345',
            isDefault: true,
          },
        ],
      },
    },
  });

  console.log('✓ Created 4 users (Super Admin, Manager, Admin, Customer)');

  // Create sample products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        sku: 'LAPTOP-001',
        name: 'Gaming Laptop Pro',
        slug: 'gaming-laptop-pro',
        description: 'High-performance gaming laptop with RTX 4090',
        categoryId: categories[0].id,
        price: 15000000,
        cost: 12000000,
        stock: 10,
        isActive: true,
        isVisible: true,
      },
    }),
    prisma.product.create({
      data: {
        sku: 'TSHIRT-001',
        name: 'Classic Cotton T-Shirt',
        slug: 'classic-cotton-tshirt',
        description: 'Comfortable 100% cotton t-shirt',
        categoryId: categories[1].id,
        price: 99000,
        cost: 50000,
        stock: 150,
        isActive: true,
        isVisible: true,
      },
    }),
    prisma.product.create({
      data: {
        sku: 'PILLOW-001',
        name: 'Memory Foam Pillow',
        slug: 'memory-foam-pillow',
        description: 'Comfortable memory foam pillow for better sleep',
        categoryId: categories[2].id,
        price: 499000,
        cost: 250000,
        stock: 50,
        isActive: true,
        isVisible: true,
      },
    }),
  ]);

  console.log(`✓ Created ${products.length} sample products`);

  // Create testimonials
  await Promise.all([
    prisma.testimonial.create({
      data: {
        name: 'Budi Santoso',
        email: 'budi@example.com',
        rating: 5,
        message: 'Great products and fast shipping!',
        status: 'APPROVED',
      },
    }),
    prisma.testimonial.create({
      data: {
        name: 'Siti Nurhaliza',
        email: 'siti@example.com',
        rating: 4,
        message: 'Good quality, excellent customer service.',
        status: 'APPROVED',
      },
    }),
  ]);

  console.log('✓ Created sample testimonials');

  // Initialize Kurir Toko configuration
  await prisma.kurirTokoConfiguration.create({
    data: {
      baseGrabRate: 1.0,
      discountPercent: 10,
      minimumCharge: 15000,
      surchargePercent: 0,
      isActive: true,
    },
  });

  console.log('✓ Initialized Kurir Toko configuration');

  console.log('✅ Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
