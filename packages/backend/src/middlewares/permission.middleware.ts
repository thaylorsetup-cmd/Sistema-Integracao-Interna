/**
 * Middleware de Autorização por Role
 */

import { Request, Response, NextFunction } from 'express';
import type { UserRole } from '../types/database.js';

// Hierarquia de permissões
const ROLE_HIERARCHY: Record<UserRole, number> = {
    admin: 100,
    gestor: 80,
    cadastro: 60,
    comercial: 40,
    operacional: 20,
};

// Permissões por funcionalidade
export const PERMISSIONS = {
    // Dashboards
    viewDashboardOperador: ['admin', 'gestor', 'operacional', 'cadastro', 'comercial'] as UserRole[],
    viewDashboardGestao: ['admin', 'gestor', 'comercial'] as UserRole[],
    viewDashboardCadastroGR: ['admin', 'gestor', 'cadastro'] as UserRole[],
    viewTvDisplay: ['admin', 'gestor', 'operacional', 'cadastro', 'comercial'] as UserRole[],

    // Auditoria
    viewAuditoria: ['admin', 'gestor'] as UserRole[],
    exportAuditoria: ['admin', 'gestor'] as UserRole[],

    // Configurações
    viewConfiguracoesPessoais: ['admin', 'gestor', 'operacional', 'cadastro', 'comercial'] as UserRole[],
    viewConfiguracoesSistema: ['admin'] as UserRole[],
    manageUsers: ['admin'] as UserRole[],
    manageIntegracoes: ['admin'] as UserRole[],

    // Ações em cadastros
    aprovarCadastros: ['admin', 'gestor', 'cadastro'] as UserRole[],
    editarCadastros: ['admin', 'gestor', 'operacional', 'cadastro', 'comercial'] as UserRole[],
    criarCadastros: ['admin', 'gestor', 'operacional', 'cadastro', 'comercial'] as UserRole[],
    deletarCadastros: ['admin'] as UserRole[],
};

export type PermissionKey = keyof typeof PERMISSIONS;

/**
 * Middleware que verifica se o usuário tem uma das roles permitidas
 */
export function authorize(...allowedRoles: UserRole[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Não autenticado'
            });
            return;
        }

        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                error: 'Sem permissão para esta ação'
            });
            return;
        }

        next();
    };
}

/**
 * Middleware que verifica se o usuário tem uma permissão específica
 */
export function requirePermission(permission: PermissionKey) {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Não autenticado'
            });
            return;
        }

        const allowedRoles = PERMISSIONS[permission];

        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                error: `Permissão negada: ${permission}`
            });
            return;
        }

        next();
    };
}

/**
 * Verifica se um usuário tem uma permissão específica
 */
export function hasPermission(role: UserRole, permission: PermissionKey): boolean {
    return PERMISSIONS[permission].includes(role);
}

/**
 * Verifica se um role tem nível maior ou igual a outro
 */
export function hasRoleLevel(userRole: UserRole, requiredRole: UserRole): boolean {
    return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}
