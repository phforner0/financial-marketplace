// src/lib/logger.ts (NOVO ARQUIVO)
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  
  private log(level: LogLevel, message: string, ...args: any[]) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    if (this.isDevelopment) {
      // Em desenvolvimento, usa console padrão
      console[level === 'debug' ? 'log' : level](prefix, message, ...args);
    } else if (level !== 'debug') {
      // Em produção, só loga warn/error
      console[level](prefix, message, ...args);
      
      // TODO: Enviar para serviço externo (Sentry, Datadog, etc)
      // this.sendToMonitoring(level, message, args);
    }
  }
  
  debug(message: string, ...args: any[]) {
    this.log('debug', message, ...args);
  }
  
  info(message: string, ...args: any[]) {
    this.log('info', message, ...args);
  }
  
  warn(message: string, ...args: any[]) {
    this.log('warn', message, ...args);
  }
  
  error(message: string, error?: Error, ...args: any[]) {
    this.log('error', message, error, ...args);
    
    // Capturar stack trace
    if (error instanceof Error && !this.isDevelopment) {
      // TODO: Enviar para Sentry
      // Sentry.captureException(error);
    }
  }
}

export const logger = new Logger();

/* SUBSTITUIR TODOS console.log por:
import { logger } from '@/lib/logger';

logger.info('Circuit breaker: Transitioning to HALF_OPEN');
logger.error('Cron Job Failed:', error);
*/