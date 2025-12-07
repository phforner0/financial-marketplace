// prisma/seed.ts
import { PrismaClient, AssetType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // 1. Create Achievements
  console.log('📊 Seeding achievements...');
  
  const achievements = [
    {
      key: 'FIRST_TRADE',
      name: 'First Trade',
      description: 'Complete your first trade',
      icon: '🎯',
      xpReward: 100,
    },
    {
      key: 'FIRST_WATCHLIST',
      name: 'Watchlist Creator',
      description: 'Create your first watchlist',
      icon: '⭐',
      xpReward: 50,
    },
    {
      key: 'FIRST_ALERT',
      name: 'Alert Master',
      description: 'Set up your first price alert',
      icon: '🔔',
      xpReward: 50,
    },
    {
      key: 'PROFITABLE_TRADE',
      name: 'In The Green',
      description: 'Make your first profitable trade',
      icon: '💰',
      xpReward: 200,
    },
    {
      key: 'TEN_TRADES',
      name: 'Active Trader',
      description: 'Complete 10 trades',
      icon: '🔥',
      xpReward: 300,
    },
    {
      key: 'HUNDRED_TRADES',
      name: 'Trading Veteran',
      description: 'Complete 100 trades',
      icon: '🏆',
      xpReward: 1000,
    },
    {
      key: 'DIVERSIFIED',
      name: 'Diversified Portfolio',
      description: 'Hold 10+ different assets',
      icon: '🌈',
      xpReward: 250,
    },
    {
      key: 'TOUR_COMPLETED',
      name: 'Platform Explorer',
      description: 'Complete the onboarding tour',
      icon: '🗺️',
      xpReward: 100,
    },
    {
      key: 'EARLY_ADOPTER',
      name: 'Early Adopter',
      description: 'Join during beta period',
      icon: '🚀',
      xpReward: 500,
    },
    {
      key: 'PROFITABLE_MONTH',
      name: 'Monthly Winner',
      description: 'End a month with positive returns',
      icon: '📈',
      xpReward: 400,
    },
  ];

  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { key: achievement.key },
      update: {},
      create: achievement,
    });
  }

  console.log(`✅ Created ${achievements.length} achievements`);

  // 2. Create Subscription Plans
  console.log('💎 Seeding subscription plans...');

  const plans = [
    {
      slug: 'free',
      name: 'Free',
      priceCents: 0,
      currency: 'USD',
      interval: 'month',
      features: [
        '3 watchlists',
        '10 active alerts',
        '15-min delayed data',
        'Basic charts',
        'Paper trading',
      ],
      isActive: true,
    },
    {
      slug: 'premium',
      name: 'Premium',
      priceCents: 999,
      currency: 'USD',
      interval: 'month',
      features: [
        'Unlimited watchlists',
        'Unlimited alerts',
        'Real-time data',
        'Advanced charts (100+ indicators)',
        'SMS alerts',
        'Priority support',
        'Ad-free experience',
        'AI features',
        'Advanced analytics',
        'Backtesting tools',
      ],
      isActive: true,
    },
    {
      slug: 'pro',
      name: 'Pro',
      priceCents: 2999,
      currency: 'USD',
      interval: 'month',
      features: [
        'Everything in Premium',
        'API access',
        'Level 2 data (order book)',
        'Custom indicators',
        'Multiple broker accounts',
        'Tax optimization tools',
        'White glove support',
        'Custom screeners',
        'Portfolio analytics',
      ],
      isActive: true,
    },
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { slug: plan.slug },
      update: {},
      create: plan,
    });
  }

  console.log(`✅ Created ${plans.length} subscription plans`);

  // 3. Create Popular Market Symbols (cached)
  console.log('📈 Seeding market symbols...');

  const symbols = [
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      exchange: 'NASDAQ',
      assetType: AssetType.STOCK,
      sector: 'Technology',
      industry: 'Consumer Electronics',
      description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.',
      ceo: 'Tim Cook',
      founded: '1976',
      employees: 161000,
      website: 'https://www.apple.com',
    },
    {
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      exchange: 'NASDAQ',
      assetType: AssetType.STOCK,
      sector: 'Technology',
      industry: 'Software',
      description: 'Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide.',
      ceo: 'Satya Nadella',
      founded: '1975',
      employees: 221000,
      website: 'https://www.microsoft.com',
    },
    {
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      exchange: 'NASDAQ',
      assetType: AssetType.STOCK,
      sector: 'Technology',
      industry: 'Internet Content & Information',
      description: 'Alphabet Inc. offers various products and platforms worldwide, including Google Search, Google Maps, YouTube, Android, and Google Cloud.',
      ceo: 'Sundar Pichai',
      founded: '1998',
      employees: 190000,
      website: 'https://abc.xyz',
    },
    {
      symbol: 'AMZN',
      name: 'Amazon.com Inc.',
      exchange: 'NASDAQ',
      assetType: AssetType.STOCK,
      sector: 'Consumer Cyclical',
      industry: 'Internet Retail',
      description: 'Amazon.com, Inc. engages in the retail sale of consumer products and subscriptions in North America and internationally.',
      ceo: 'Andy Jassy',
      founded: '1994',
      employees: 1540000,
      website: 'https://www.amazon.com',
    },
    {
      symbol: 'TSLA',
      name: 'Tesla, Inc.',
      exchange: 'NASDAQ',
      assetType: AssetType.STOCK,
      sector: 'Consumer Cyclical',
      industry: 'Auto Manufacturers',
      description: 'Tesla, Inc. designs, develops, manufactures, leases, and sells electric vehicles, and energy generation and storage systems.',
      ceo: 'Elon Musk',
      founded: '2003',
      employees: 127855,
      website: 'https://www.tesla.com',
    },
    {
      symbol: 'NVDA',
      name: 'NVIDIA Corporation',
      exchange: 'NASDAQ',
      assetType: AssetType.STOCK,
      sector: 'Technology',
      industry: 'Semiconductors',
      description: 'NVIDIA Corporation operates as a visual computing company worldwide.',
      ceo: 'Jensen Huang',
      founded: '1993',
      employees: 29600,
      website: 'https://www.nvidia.com',
    },
    {
      symbol: 'META',
      name: 'Meta Platforms, Inc.',
      exchange: 'NASDAQ',
      assetType: AssetType.STOCK,
      sector: 'Technology',
      industry: 'Internet Content & Information',
      description: 'Meta Platforms, Inc. engages in the development of products that enable people to connect and share with friends and family through mobile devices, personal computers, virtual reality headsets, and wearables worldwide.',
      ceo: 'Mark Zuckerberg',
      founded: '2004',
      employees: 86482,
      website: 'https://about.meta.com',
    },
    {
      symbol: 'BTC-USD',
      name: 'Bitcoin USD',
      exchange: 'CRYPTO',
      assetType: AssetType.CRYPTO,
      sector: 'Cryptocurrency',
      industry: 'Digital Currency',
      description: 'Bitcoin is a decentralized digital currency that can be transferred on the peer-to-peer bitcoin network.',
    },
    {
      symbol: 'ETH-USD',
      name: 'Ethereum USD',
      exchange: 'CRYPTO',
      assetType: AssetType.CRYPTO,
      sector: 'Cryptocurrency',
      industry: 'Digital Currency',
      description: 'Ethereum is a decentralized, open-source blockchain with smart contract functionality.',
    },
    {
      symbol: 'SPY',
      name: 'SPDR S&P 500 ETF Trust',
      exchange: 'NYSE',
      assetType: AssetType.ETF,
      sector: 'N/A',
      industry: 'N/A',
      description: 'The SPDR S&P 500 ETF Trust seeks to provide investment results that correspond to the price and yield performance of the S&P 500 Index.',
    },
  ];

  for (const symbol of symbols) {
    await prisma.marketSymbol.upsert({
      where: { symbol: symbol.symbol },
      update: {},
      create: symbol,
    });
  }

  console.log(`✅ Created ${symbols.length} market symbols`);

  // 4. Create Demo User (for testing)
  console.log('👤 Creating demo user...');

  const hashedPassword = await bcrypt.hash('demo123456', 12);

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@finmarket.com' },
    update: {},
    create: {
      email: 'demo@finmarket.com',
      passwordHash: hashedPassword,
      name: 'Demo User',
      username: 'demo',
      emailVerified: new Date(),
      onboardingCompleted: true,
      tourCompleted: true,
      experience: 'INTERMEDIATE',
      objective: 'GROWTH',
      riskTolerance: 'MODERATE',
      horizon: 'MEDIUM',
      interests: ['STOCKS', 'CRYPTO', 'ETFS'],
    },
  });

  console.log(`✅ Created demo user: ${demoUser.email}`);

  // 5. Create Demo Portfolio
  console.log('💼 Creating demo portfolio...');

  await prisma.portfolio.create({
    data: {
      userId: demoUser.id,
      name: 'My Portfolio',
      type: 'PAPER',
      isDefault: true,
      totalValue: 100000,
      cash: 50000,
      positions: {
        create: [
          {
            symbol: 'AAPL',
            assetType: AssetType.STOCK,
            qty: 50,
            avgPrice: 150.00,
            currentPrice: 178.23,
            marketValue: 8911.50,
            unrealizedPL: 1411.50,
            realizedPL: 0,
          },
          {
            symbol: 'MSFT',
            assetType: AssetType.STOCK,
            qty: 30,
            avgPrice: 320.50,
            currentPrice: 412.45,
            marketValue: 12373.50,
            unrealizedPL: 2758.50,
            realizedPL: 0,
          },
          {
            symbol: 'NVDA',
            assetType: AssetType.STOCK,
            qty: 20,
            avgPrice: 420.00,
            currentPrice: 495.32,
            marketValue: 9906.40,
            unrealizedPL: 1506.40,
            realizedPL: 0,
          },
        ],
      },
    },
  });

  console.log(`✅ Created demo portfolio with 3 positions`);

  // 6. Create Demo Watchlist
  console.log('⭐ Creating demo watchlist...');

  await prisma.watchlist.create({
    data: {
      userId: demoUser.id,
      name: 'Tech Giants',
      description: 'My favorite tech stocks',
      isPublic: false,
      items: {
        create: [
          { symbol: 'AAPL', assetType: AssetType.STOCK, order: 0, isFavorite: true },
          { symbol: 'MSFT', assetType: AssetType.STOCK, order: 1 },
          { symbol: 'GOOGL', assetType: AssetType.STOCK, order: 2 },
          { symbol: 'AMZN', assetType: AssetType.STOCK, order: 3 },
          { symbol: 'META', assetType: AssetType.STOCK, order: 4 },
          { symbol: 'NVDA', assetType: AssetType.STOCK, order: 5 },
        ],
      },
    },
  });

  console.log(`✅ Created demo watchlist`);

  // 7. Create Demo Alert
  console.log('🔔 Creating demo alert...');

  await prisma.alert.create({
    data: {
      userId: demoUser.id,
      symbol: 'AAPL',
      type: 'PRICE',
      status: 'ACTIVE',
      priceThreshold: 180.00,
      directionUp: true,
      channels: ['PUSH', 'EMAIL'],
      recurring: false,
      message: 'AAPL crossed $180',
    },
  });

  console.log(`✅ Created demo alert`);

  console.log('');
  console.log('🎉 Seed completed successfully!');
  console.log('');
  console.log('🔑 Demo credentials:');
  console.log('   Email: demo@finmarket.com');
  console.log('   Password: demo123456');
  console.log('');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });