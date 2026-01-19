/**
 * Middleware de Permissoes
 * Controle de acesso baseado em roles (RBAC)
 */
import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest, Permission } from '../types/api.js';
import type { UserRole } from '../types/database.js';

// Definicao de permissoes por role
const rolePermissions: Record<UserRole, Permission> = {
  admin: {
    viewDashboardOperador: true,
    viewDashboardGestao: true,
    viewDashboardCadastroGR: true,
    viewTvDisplay: true,
    viewAuditoria: true,
    exportAuditoria: true,
    viewConfiguracoesPessoais: true,
    viewConfiguracoesSistema: true,
    manageUsers: true,
    manageIntegracoes: true,
    aprovarCadastros: true,
    editarCadastros: true,
    criarCadastros: true,
    deletarCadastros: true,
  },
  gestor: {
    viewDashboardOperador: true,
    viewDashboardGestao: true,
    viewDashboardCadastroGR: true,
    viewTvDisplay: true,
    viewAuditoria: true,
    exportAuditoria: true,
    viewConfiguracoesPessoais: true,
    viewConfiguracoesSistema: false,
    manageUsers: false,
    manageIntegracoes: false,
    aprovarCadastros: true,
    editarCadastros: true,
    criarCadastros: true,
    deletarCadastros: false,
  },
  operacional: {
    viewDashboardOperador: true,
    viewDashboardGestao: false,
    viewDashboardCadastroGR: false,
    viewTvDisplay: true,
    viewAuditoria: false,
    exportAuditoria: false,
    viewConfiguracoesPessoais: true,
    viewConfiguracoesSistema: false,
    manageUsers: false,
    manageIntegracoes: false,
    aprovarCadastros: false,
    editarCadastros: false,
    criarCadastros: true,
    deletarCadastros: false,
  },
  cadastro: {
    viewDashboardOperador: false,
    viewDashboardGestao: false,
    viewDashboardCadastroGR: true,
    viewTvDisplay: true,
    viewAuditoria: false,
    exportAuditoria: false,
    viewConfiguracoesPessoais: true,
    viewConfiguracoesSistema: false,
    manageUsers: false,
    manageIntegracoes: false,
    aprovarCadastros: true,
    editarCadastros: true,
    criarCadastros: false,
    deletarCadastros: false,
  },
  comercial: {
    viewDashboardOperador: false,
    viewDashboardGestao: true,
    viewDashboardCadastroGR: false,
    viewTvDisplay: true,
    viewAuditoria: true,
    exportAuditoria: false,
    viewConfiguracoesPessoais: true,
    viewConfiguracoesSistema: false,
    manageUsers: false,
    manageIntegracoes: false,
    aprovarCadastros: false,
    editarCadastros: false,
    criarCadastros: false,
    deletarCadastros: false,
  },
  auditor: {
    viewDashboardOperador: false,
    viewDashboardGestao: false,
    viewDashboardCadastroGR: false,
    viewTvDisplay: false,
    viewAuditoria: true,
    exportAuditoria: true,
    viewConfiguracoesPessoais: true,
    viewConfiguracoesSistema: false,
    manageUsers: false,
    manageIntegracoes: false,
    aprovarCadastros: false,
    editarCadastros: false,
    criarCadastros: false,
    deletarCadastros: false,
  },
};

/**
 * Obtem permissoes de um role
 */
export function getPermissions(role: UserRole): Permission {
  return rolePermissions[role] || rolePermissions.operacional;
}

/**
 * Verifica se usuario tem permissao especifica
 */
export function hasPermission(role: UserRole, permission: keyof Permission): boolean {
  const permissions = getPermissions(role);
  return permissions[permission] === true;
}

/**
 * Middleware que requer roles especificos
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Nao autenticado',
        message: 'Usuario nao autenticado',
      });
      return;
    }

    const userRole = req.user.role as UserRole;

    if (!allowedRoles.includes(userRole)) {
      res.status(403).json({
        success: false,
        error: 'Sem permissao',
        message: `Acesso restrito para: ${allowedRoles.join(', ')}`,
      });
      return;
    }

    next();
  };
}

/**
 * Middleware que requer permissao especifica
 */
export function requirePermission(permission: keyof Permission) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Nao autenticado',
        message: 'Usuario nao autenticado',
      });
      return;
    }

    const userRole = req.user.role as UserRole;

    if (!hasPermission(userRole, permission)) {
      res.status(403).json({
        success: false,
        error: 'Sem permissao',
        message: `Permissao necessaria: ${permission}`,
      });
      return;
    }

    next();
  };
}

/**
 * Middleware que requer qualquer uma das permissoes
 */
export function requireAnyPermission(...permissions: (keyof Permission)[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Nao autenticado',
        message: 'Usuario nao autenticado',
      });
      return;
    }

    const userRole = req.user.role as UserRole;
    const hasAny = permissions.some((perm) => hasPermission(userRole, perm));

    if (!hasAny) {
      res.status(403).json({
        success: false,
        error: 'Sem permissao',
        message: `Uma das permissoes necessarias: ${permissions.join(', ')}`,
      });
      return;
    }

    next();
  };
}
