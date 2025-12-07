# 💼 Financial Marketplace

Modern financial trading platform built with Next.js 14, Prisma, and real-time market data integration.

## ✨ Features

- 📊 **Real-time Market Data** - Live quotes from multiple sources (Brapi, Tiingo)
- 💼 **Portfolio Management** - Track investments with paper trading
- ⭐ **Watchlists** - Organize and monitor favorite stocks
- 🔔 **Price Alerts** - Get notified when stocks hit target prices
- 📈 **Interactive Charts** - TradingView-style analysis
- 🎯 **Market Heatmap** - Visualize market movements
- 🔐 **Secure Authentication** - NextAuth with OAuth support

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database (Supabase/Neon recommended)
- Redis (Upstash recommended)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/financial-marketplace.git
cd financial-marketplace
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment variables:
```bash
cp .env.example .env
```

4. Configure `.env` with your credentials (see [Environment Variables](#environment-variables))

5. Setup database:
```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

6. Run development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000)

### Demo Credentials
```
Email: demo@finmarket.com
Password: demo123456
```

## 📚 Environment Variables

See `.env.example` for a complete list. Key variables:
```bash
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Auth
NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"

# Market Data APIs
BRAPI_TOKEN="your-token"        # https://brapi.dev
TIINGO_API_KEY="your-key"       # https://www.tiingo.com

# Redis Cache
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."
```

## 🏗️ Architecture
```
src/
├── app/                # Next.js App Router
│   ├── api/           # API routes
│   ├── auth/          # Authentication pages
│   └── dashboard/     # Main app pages
├── components/        # React components
│   ├── features/     # Feature-specific components
│   ├── layouts/      # Layout components
│   └── ui/           # Reusable UI components
├── lib/              # Utilities & configurations
│   ├── auth.ts       # NextAuth config
│   ├── prisma.ts     # Prisma client
│   ├── redis.ts      # Redis cache layer
│   └── market-api.ts # Market data integration
└── styles/           # Global styles & CSS modules
```

## 🧪 Testing
```bash
# Run unit tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## 🚢 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

### Docker
```bash
docker build -t financial-marketplace .
docker run -p 3000:3000 financial-marketplace
```

## 📖 API Documentation

### Market Data

- `GET /api/markets/quote?symbol=AAPL` - Get single quote
- `GET /api/markets/search?q=tesla` - Search symbols
- `GET /api/markets/indices` - Get major indices
- `GET /api/markets/movers` - Top gainers/losers
- `GET /api/markets/heatmap` - Market heatmap data

### Portfolio

- `GET /api/portfolio` - Get user portfolio
- `GET /api/portfolio/positions` - Get all positions
- `POST /api/broker/orders` - Place order

### Watchlists

- `GET /api/watchlists` - List all watchlists
- `POST /api/watchlists` - Create watchlist
- `DELETE /api/watchlists/[id]` - Delete watchlist
- `POST /api/watchlists/[id]/items` - Add item
- `DELETE /api/watchlists/[id]/items?symbol=XYZ` - Remove item

### Alerts

- `GET /api/alerts` - List alerts
- `POST /api/alerts` - Create alert
- `PATCH /api/alerts/[id]` - Update alert
- `DELETE /api/alerts/[id]` - Delete alert

## 🔐 Security

- All API routes require authentication
- Rate limiting on sensitive endpoints
- Environment variables validation
- SQL injection prevention (Prisma)
- XSS protection (Next.js built-in)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 🙏 Acknowledgments

- Market data: [Brapi](https://brapi.dev), [Tiingo](https://www.tiingo.com)
- Icons: [Lucide React](https://lucide.dev)
- Charts: [Recharts](https://recharts.org), [D3.js](https://d3js.org)
- UI Inspiration: [TradingView](https://www.tradingview.com)