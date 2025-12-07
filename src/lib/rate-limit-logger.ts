// src/lib/rate-limit-logger.ts (NOVO ARQUIVO)

/**
 * Registra quando um erro 429 ocorre para informar o usuário
 */
export function logRateLimitError() {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('lastRateLimitError', new Date().toISOString());
      
      // Dispara evento customizado para atualizar UI
      window.dispatchEvent(new Event('rateLimitError'));
    }
  }
  
  /**
   * Verifica se há rate limit ativo
   */
  export function isRateLimited(): boolean {
    if (typeof window === 'undefined') return false;
    
    const lastError = sessionStorage.getItem('lastRateLimitError');
    if (!lastError) return false;
    
    const errorTime = new Date(lastError);
    const now = new Date();
    const hoursSinceError = (now.getTime() - errorTime.getTime()) / (1000 * 60 * 60);
    
    return hoursSinceError < 1;
  }
  
  /**
   * Limpa o flag de rate limit
   */
  export function clearRateLimitFlag() {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('lastRateLimitError');
    }
  }