/**
 * Middleware de tratamento de erros
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger.js';
import { ZodError } from 'zod';

export interface AppError extends Error {
    statusCode?: number;
    isOperational?: boolean;
}

/**
 * Classe de erro customizada
 */
export class HttpError extends Error implements AppError {
    statusCode: number;
    isOperational: boolean;

    constructor(message: string, statusCode: number = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Erros comuns pré-definidos
 */
export const Errors = {
    NotFound: (resource: string = 'Recurso') =>
        new HttpError(`${resource} não encontrado`, 404),

    Unauthorized: (message: string = 'Não autorizado') =>
        new HttpError(message, 401),

    Forbidden: (message: string = 'Acesso negado') =>
        new HttpError(message, 403),

    BadRequest: (message: string = 'Requisição inválida') =>
        new HttpError(message, 400),

    Conflict: (message: string = 'Conflito de dados') =>
        new HttpError(message, 409),

    InternalError: (message: string = 'Erro interno do servidor') =>
        new HttpError(message, 500),
};

/**
 * Middleware handler de erros
 */
export function errorHandler(
    err: AppError,
    req: Request,
    res: Response,
    _next: NextFunction
): void {
    // Log do erro
    logger.error({
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        body: req.body,
        userId: req.userId,
    });

    // Erro de validação Zod
    if (err instanceof ZodError) {
        res.status(400).json({
            success: false,
            error: 'Erro de validação',
            details: err.errors.map(e => ({
                field: e.path.join('.'),
                message: e.message,
            })),
        });
        return;
    }

    // Erro operacional (esperado)
    if (err.isOperational) {
        res.status(err.statusCode || 500).json({
            success: false,
            error: err.message,
        });
        return;
    }

    // Erro inesperado
    res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
    });
}

/**
 * Wrapper para rotas async
 */
export function asyncHandler(
    fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
