/**
 * Middleware de Autenticação JWT
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { db } from '../config/database.js';
import type { User, UserRole } from '../types/database.js';

// Extender Request do Express
declare global {
    namespace Express {
        interface Request {
            user?: User;
            userId?: string;
        }
    }
}

export interface JWTPayload {
    userId: string;
    email: string;
    role: UserRole;
    iat: number;
    exp: number;
}

/**
 * Middleware que verifica se o usuário está autenticado
 */
export async function authenticate(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                error: 'Token não fornecido'
            });
            return;
        }

        const token = authHeader.split(' ')[1];

        const decoded = jwt.verify(token, config.JWT_SECRET) as JWTPayload;

        // Buscar usuário no banco
        const user = await db
            .selectFrom('users')
            .selectAll()
            .where('id', '=', decoded.userId)
            .where('ativo', '=', true)
            .executeTakeFirst();

        if (!user) {
            res.status(401).json({
                success: false,
                error: 'Usuário não encontrado ou inativo'
            });
            return;
        }

        req.user = user;
        req.userId = user.id;
        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({
                success: false,
                error: 'Token expirado'
            });
            return;
        }

        if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).json({
                success: false,
                error: 'Token inválido'
            });
            return;
        }

        res.status(500).json({
            success: false,
            error: 'Erro de autenticação'
        });
    }
}

/**
 * Gera um token JWT para o usuário
 */
export function generateToken(user: User): string {
    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
        userId: user.id,
        email: user.email,
        role: user.role,
    };

    return jwt.sign(payload, config.JWT_SECRET, {
        expiresIn: config.JWT_EXPIRES_IN,
    });
}

/**
 * Verifica um token e retorna o payload
 */
export function verifyToken(token: string): JWTPayload | null {
    try {
        return jwt.verify(token, config.JWT_SECRET) as JWTPayload;
    } catch {
        return null;
    }
}
