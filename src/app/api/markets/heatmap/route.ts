import { NextResponse } from 'next/server';
import { marketAPI } from '@/lib/market-api';

// Cache por 5 minutos para não estourar o limite da API
export const revalidate = 300;

export async function GET() {
  try {
    // Lista de ativos representativos para o MVP (Mistura de BR e US)
    // Isso é necessário porque não temos um endpoint "all stocks" gratuito
    const symbols = [
      // US Tech
      'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META',
      // US Finance
      'JPM', 'BAC', 'V',
      // BR Blue Chips (Brapi)
      'PETR4',
    ];

    const quotes = await marketAPI.getQuotes(symbols);

    // Mapeia para o formato do componente MarketHeatmap
    // Adiciona setor "mockado" por enquanto, já que as APIs free nem sempre retornam setor no endpoint de quote
    const heatmapData = quotes.map(q => {
        let sector = 'Technology'; // Default
        if (['JPM', 'BAC', 'V', 'ITUB4', 'BBDC4', 'BBAS3'].includes(q.symbol)) sector = 'Finance';
        if (['PETR4', 'VALE3'].includes(q.symbol)) sector = 'Energy/Materials';
        if (['WEGE3'].includes(q.symbol)) sector = 'Industrial';

        return {
            symbol: q.symbol,
            name: q.symbol, 
            sector: sector,
            marketCap: q.price * (q.volume || 1000000), // Estimativa grosseira para o tamanho do quadrado
            changePercent: q.changePercent,
            price: q.price
        };
    });

    return NextResponse.json(heatmapData);
  } catch (error) {
    console.error('Heatmap API Error:', error);
    return NextResponse.json({ error: 'Failed to generate heatmap' }, { status: 500 });
  }
}