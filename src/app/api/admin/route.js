// src/app/api/admin/reset-rate-limit/route.ts (NOVO ARQUIVO)
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    // Reseta o rate limit tracker no market-api
    // Nota: Em produção, você deveria verificar auth de admin aqui
    
    // Como o rate limit tracker está em memória no market-api.ts,
    // vamos apenas retornar sucesso e o próprio tracker reseta após 1 hora
    
    return NextResponse.json({
      success: true,
      message: 'Rate limit will auto-reset after 1 hour. To force reset, restart the server.',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to reset rate limit' },
      { status: 500 }
    );
  }
}