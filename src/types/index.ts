export interface Stock {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    marketCap: number;
  }
  
  export interface Position {
    symbol: string;
    quantity: number;
    avgPrice: number;
    currentPrice: number;
    value: number;
    profitLoss: number;
    profitLossPercent: number;
  }
  
  export interface MarketIndex {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
  }