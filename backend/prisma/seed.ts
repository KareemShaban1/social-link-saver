import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create default subscription plans
  const freePlan = await prisma.subscriptionPlan.upsert({
    where: { id: 'free-plan-id' },
    update: {},
    create: {
      id: 'free-plan-id',
      name: 'Free',
      description: 'Basic plan for getting started',
      priceMonthly: 0,
      priceYearly: 0,
      maxLinks: 50,
      maxCategories: 10,
      features: ['Basic link saving', 'Category organization', 'Search'],
    },
  });

  const proPlan = await prisma.subscriptionPlan.upsert({
    where: { id: 'pro-plan-id' },
    update: {},
    create: {
      id: 'pro-plan-id',
      name: 'Pro',
      description: 'For power users',
      priceMonthly: 9.99,
      priceYearly: 99.99,
      maxLinks: 1000,
      maxCategories: 100,
      features: [
        'Unlimited links',
        'Advanced categories',
        'Priority support',
        'Export data',
      ],
    },
  });

  const enterprisePlan = await prisma.subscriptionPlan.upsert({
    where: { id: 'enterprise-plan-id' },
    update: {},
    create: {
      id: 'enterprise-plan-id',
      name: 'Enterprise',
      description: 'For teams and businesses',
      priceMonthly: 29.99,
      priceYearly: 299.99,
      maxLinks: null, // Unlimited
      maxCategories: null, // Unlimited
      features: [
        'Everything in Pro',
        'Team collaboration',
        'Advanced analytics',
        'API access',
        'Custom integrations',
      ],
    },
  });

  console.log('✅ Subscription plans created');

  // Create a test user (optional - remove in production)
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      password: hashedPassword,
      fullName: 'Test User',
      profile: {
        create: {
          fullName: 'Test User',
        },
      },
      subscription: {
        create: {
          planId: freePlan.id,
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      },
    },
  });

  // Create default categories for test user
  const categories = [
    { name: 'Social Media', color: '#ec4899' },
    { name: 'Articles', color: '#3b82f6' },
    { name: 'Videos', color: '#ef4444' },
    { name: 'Shopping', color: '#10b981' },
    { name: 'Inspiration', color: '#f59e0b' },
  ];

  for (const cat of categories) {
    await prisma.category.create({
      data: {
        name: cat.name,
        color: cat.color,
        userId: testUser.id,
      },
    });
  }

  console.log('✅ Test user and default categories created');
  console.log('📧 Test user email: test@example.com');
  console.log('🔑 Test user password: password123');
  console.log('✨ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
