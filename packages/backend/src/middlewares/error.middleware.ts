/**
 * Middleware de Tratamento de Erros
 * Captura e formata erros de forma consistente
 */
import type { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';
import { ZodError } from 'zod';
import { MulterError } from 'multer';

// Tipos de erro customizados
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Recurso nao encontrado') {
    super(404, message, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Nao autorizado') {
    super(401, message, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Acesso negado') {
    super(403, message, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class ValidationError extends AppError {
  constructor(
    message = 'Dados invalidos',
    public details?: unknown
  ) {
    super(400, message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflito de dados') {
    super(409, message, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

// Middleware de erro 404
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: 'Rota nao encontrada',
    message: `Rota ${req.method} ${req.path} nao existe`,
    path: req.path,
  });
}

// Middleware global de erros
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log do erro
  logger.error('Erro capturado:', {
    name: err.name,
    message: err.message,
    stack: env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Erro de validacao Zod
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Erro de validacao',
      message: 'Dados invalidos',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // Erro do Multer (upload)
  if (err instanceof MulterError) {
    let message = 'Erro no upload de arquivo';
    let statusCode = 400;

    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'Arquivo muito grande. Tamanho maximo: 50MB';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Muitos arquivos. Maximo de 10 por vez';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = `Campo de arquivo inesperado: ${err.field}`;
        break;
      default:
        message = err.message;
    }

    res.status(statusCode).json({
      success: false,
      error: 'Erro de upload',
      message,
      code: err.code,
    });
    return;
  }

  // Erro customizado da aplicacao
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.code || err.name,
      message: err.message,
      ...(err instanceof ValidationError && err.details
        ? { details: err.details }
        : {}),
    });
    return;
  }

  // Erro de sintaxe JSON
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      success: false,
      error: 'JSON invalido',
      message: 'O corpo da requisicao contem JSON invalido',
    });
    return;
  }

  // Erro generico
  res.status(500).json({
    success: false,
    error: 'Erro interno',
    message:
      env.NODE_ENV === 'production'
        ? 'Ocorreu um erro interno. Tente novamente mais tarde.'
        : err.message,
    ...(env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
}
