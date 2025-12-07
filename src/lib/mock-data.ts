// src/lib/mock-data.ts

export const generateMockStocks = () => {
  const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'JPM', 'V', 'WMT'];
  const names = [
    'Apple Inc.', 
    'Microsoft Corp.', 
    'Alphabet Inc.', 
    'Amazon.com Inc.', 
    'NVIDIA Corp.', 
    'Meta Platforms', 
    'Tesla Inc.', 
    'JPMorgan Chase', 
    'Visa Inc.', 
    'Walmart Inc.'
  ];
  
  return symbols.map((symbol, i) => ({
    symbol,
    name: names[i],
    price: parseFloat((Math.random() * 500 + 50).toFixed(2)),
    change: parseFloat(((Math.random() - 0.5) * 20).toFixed(2)),
    changePercent: parseFloat(((Math.random() - 0.5) * 5).toFixed(2)),
    volume: Math.floor(Math.random() * 100000000),
    marketCap: Math.floor(Math.random() * 3000000000000)
  }));
};

export const mockPortfolio = {
  totalValue: 52384.67,
  cash: 12450.00,
  todayChange: 456.23,
  todayChangePercent: 0.88,
  totalReturn: 8234.67,
  totalReturnPercent: 18.6,
  positions: [
    { 
      symbol: 'AAPL', 
      quantity: 50, 
      avgPrice: 165.40, 
      currentPrice: 178.23, 
      value: 8911.50, 
      profitLoss: 641.50, 
      profitLossPercent: 7.8 
    },
    { 
      symbol: 'MSFT', 
      quantity: 20, 
      avgPrice: 380.20, 
      currentPrice: 412.45, 
      value: 8249.00, 
      profitLoss: 645.00, 
      profitLossPercent: 8.5 
    },
    { 
      symbol: 'NVDA', 
      quantity: 15, 
      avgPrice: 420.50, 
      currentPrice: 495.32, 
      value: 7429.80, 
      profitLoss: 1122.30, 
      profitLossPercent: 17.8 
    }
  ]
};

export const mockIndices = [
  { 
    symbol: 'SPX', 
    name: 'S&P 500', 
    price: 5234.18, 
    change: 23.45, 
    changePercent: 0.45 
  },
  { 
    symbol: 'IXIC', 
    name: 'Nasdaq', 
    price: 16832.62, 
    change: 103.82, 
    changePercent: 0.62 
  },
  { 
    symbol: 'DJI', 
    name: 'Dow Jones', 
    price: 38654.42, 
    change: -46.38, 
    changePercent: -0.12 
  },
  { 
    symbol: 'BTC', 
    name: 'Bitcoin', 
    price: 67234, 
    change: 1539, 
    changePercent: 2.34 
  }
];