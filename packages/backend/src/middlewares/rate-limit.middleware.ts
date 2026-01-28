/**
 * Middleware de Rate Limiting
 * Limita requisicoes por usuario/IP
 */
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../types/api.js';

/**
 * Rate limiter padrao
 * 150 requests por minuto por IP/usuario (aumentado para 10-20 usuarios simultaneos)
 */
export const defaultRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 150, // Aumentado de 100 para 150
  standardHeaders: true,
  legacyHeaders: false,

  // Identificar por usuario autenticado ou IP
  keyGenerator: (req: Request): string => {
    const authReq = req as AuthenticatedRequest;
    if (authReq.user?.id) {
      return `user_${authReq.user.id}`;
    }
    return req.ip || 'unknown';
  },

  // Handler quando limite excedido
  handler: (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    logger.warn(`Rate limit excedido para: ${authReq.user?.email || req.ip}`);

    res.status(429).json({
      success: false,
      error: 'Muitas requisicoes',
      message: 'Limite de requisicoes excedido. Tente novamente em alguns minutos.',
      retryAfter: 60, // 1 minuto
    });
  },

  // Skip para rotas de health check
  skip: (req: Request): boolean => {
    return req.path === '/health' || req.path === '/api/health';
  },
});

/**
 * Rate limiter mais restrito para autenticacao
 * 10 tentativas por 15 minutos
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,

  keyGenerator: (req: Request): string => {
    // Usar email se disponivel, senao IP
    const email = req.body?.email;
    if (email) {
      return `auth_${email}`;
    }
    return `auth_ip_${req.ip || 'unknown'}`;
  },

  handler: (req: Request, res: Response) => {
    logger.warn(`Rate limit de auth excedido para: ${req.body?.email || req.ip}`);

    res.status(429).json({
      success: false,
      error: 'Muitas tentativas de login',
      message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
      retryAfter: 900, // 15 minutos em segundos
    });
  },
});

/**
 * Rate limiter para uploads
 * 30 uploads por minuto (mais permissivo para multiplos usuarios)
 */
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30, // 30 uploads por minuto
  standardHeaders: true,
  legacyHeaders: false,

  keyGenerator: (req: Request): string => {
    const authReq = req as AuthenticatedRequest;
    if (authReq.user?.id) {
      return `upload_${authReq.user.id}`;
    }
    return `upload_ip_${req.ip || 'unknown'}`;
  },

  handler: (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    logger.warn(`Rate limit de upload excedido para: ${authReq.user?.email || req.ip}`);

    res.status(429).json({
      success: false,
      error: 'Limite de uploads excedido',
      message: 'Muitos uploads simultaneos. Aguarde 1 minuto.',
      retryAfter: 60, // 1 minuto
    });
  },
});

/**
 * Rate limiter para downloads
 * 50 downloads por minuto
 */
export const downloadRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 50, // 50 downloads por minuto
  standardHeaders: true,
  legacyHeaders: false,

  keyGenerator: (req: Request): string => {
    const authReq = req as AuthenticatedRequest;
    if (authReq.user?.id) {
      return `download_${authReq.user.id}`;
    }
    return `download_ip_${req.ip || 'unknown'}`;
  },

  handler: (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    logger.warn(`Rate limit de download excedido para: ${authReq.user?.email || req.ip}`);

    res.status(429).json({
      success: false,
      error: 'Limite de downloads excedido',
      message: 'Muitos downloads simultaneos. Aguarde 1 minuto.',
      retryAfter: 60,
    });
  },
});
