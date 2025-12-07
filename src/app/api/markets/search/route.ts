// src/app/api/markets/search/route.ts - CORRIGIDO COM QUOTES
import { NextResponse } from 'next/server';
import { marketAPI } from '@/lib/market-api';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  try {
    console.log(`🔍 Searching for: ${q}`);
    
    // 1. Busca símbolos
    const results = await marketAPI.searchSymbols(q);
    
    if (results.length === 0) {
      console.log('❌ No symbols found');
      return NextResponse.json([]);
    }
    
    console.log(`✅ Found ${results.length} symbols`);
    
    // 2. Busca cotações para os símbolos encontrados
    const symbols = results.map(r => r.symbol);
    const quotes = await marketAPI.getQuotes(symbols);
    
    // 3. Mapa de cotações para acesso rápido
    const quoteMap = new Map(quotes.map(q => [q.symbol, q]));
    
    // 4. Mescla resultados com cotações
    const enrichedResults = results.map(result => {
      const quote = quoteMap.get(result.symbol);
      
      return {
        symbol: result.symbol,
        name: result.description,
        price: quote?.price || 0,
        change: quote?.change || 0,
        changePercent: quote?.changePercent || 0,
        volume: quote?.volume || 0,
        marketCap: 0, // Não disponível na busca rápida
        exchange: result.exchange,
        country: result.country
      };
    });
    
    console.log(`📊 Enriched ${enrichedResults.filter(r => r.price > 0).length}/${enrichedResults.length} with quotes`);
    
    return NextResponse.json(enrichedResults);
  } catch (error) {
    console.error('❌ Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}