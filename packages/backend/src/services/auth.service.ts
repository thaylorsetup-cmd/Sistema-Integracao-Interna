/**
 * Serviço de Autenticação
 */

import bcrypt from 'bcryptjs';
import { db } from '../config/database.js';
import { generateToken } from '../middlewares/auth.middleware.js';
import { logger } from '../config/logger.js';
import type { User, NewUser } from '../types/database.js';
import { PERMISSIONS } from '../middlewares/permission.middleware.js';

const SALT_ROUNDS = 10;

export interface LoginResult {
    user: Omit<User, 'password_hash'>;
    token: string;
    permissions: Record<string, boolean>;
}

/**
 * Faz login do usuário
 */
export async function login(email: string, password: string): Promise<LoginResult | null> {
    const user = await db
        .selectFrom('users')
        .selectAll()
        .where('email', '=', email.toLowerCase())
        .where('ativo', '=', true)
        .executeTakeFirst();

    if (!user) {
        logger.warn(`Tentativa de login com email inexistente: ${email}`);
        return null;
    }

    const passwordValid = await bcrypt.compare(password, user.password_hash);

    if (!passwordValid) {
        logger.warn(`Senha inválida para usuário: ${email}`);
        return null;
    }

    const token = generateToken(user);

    // Calcular permissões
    const permissions: Record<string, boolean> = {};
    for (const [key, allowedRoles] of Object.entries(PERMISSIONS)) {
        permissions[key] = allowedRoles.includes(user.role);
    }

    // Remove password_hash do retorno
    const { password_hash, ...userWithoutPassword } = user;

    logger.info(`Login realizado: ${user.email}`);

    return {
        user: userWithoutPassword,
        token,
        permissions,
    };
}

/**
 * Cria hash de senha
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verifica senha
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

/**
 * Busca usuário por ID
 */
export async function getUserById(id: string): Promise<Omit<User, 'password_hash'> | null> {
    const user = await db
        .selectFrom('users')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst();

    if (!user) return null;

    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
}

/**
 * Busca usuário por email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
    const user = await db
        .selectFrom('users')
        .selectAll()
        .where('email', '=', email.toLowerCase())
        .executeTakeFirst();

    return user || null;
}

/**
 * Cria novo usuário
 */
export async function createUser(userData: Omit<NewUser, 'password_hash'> & { password: string }): Promise<Omit<User, 'password_hash'>> {
    const { password, ...rest } = userData;
    const password_hash = await hashPassword(password);

    const [user] = await db
        .insertInto('users')
        .values({
            ...rest,
            email: rest.email.toLowerCase(),
            password_hash,
            ativo: true,
        })
        .returningAll()
        .execute();

    const { password_hash: _, ...userWithoutPassword } = user;
    logger.info(`Usuário criado: ${user.email}`);

    return userWithoutPassword;
}
