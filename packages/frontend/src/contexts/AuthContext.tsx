import { createContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Permission } from '@/types';
import { authApi } from '@/services/api';

// =====================================================
// TIPOS
// =====================================================

export interface User {
  id: string;
  email: string;
  nome: string;
  role: 'admin' | 'gestor' | 'operacional' | 'cadastro' | 'comercial' | 'auditor';
  ativo: boolean;
  avatar?: string;
  filialId?: string;
}

export interface AuthState {
  user: User | null;
  permissions: Permission | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasPermission: (permission: keyof Permission) => boolean;
  isAdmin: () => boolean;
}

// =====================================================
// CONTEXT
// =====================================================

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    permissions: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Verificar sessao ao iniciar
  const checkSession = useCallback(async () => {
    try {
      const response = await authApi.getMe();

      if (response.success && response.data) {
        const { user, permissions } = response.data as {
          user: User;
          permissions: Permission;
        };

        setAuthState({
          user,
          permissions,
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        setAuthState({
          user: null,
          permissions: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    } catch {
      // Sessao invalida ou expirada
      setAuthState({
        user: null,
        permissions: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Login
  const login = async (email: string, password: string) => {
    setAuthState((prev) => ({ ...prev, isLoading: true }));

    try {
      const response = await authApi.signIn(email, password);

      if (!response.success) {
        throw new Error(response.error || 'Erro ao fazer login');
      }

      // Buscar dados do usuario apos login
      await checkSession();
    } catch (error) {
      setAuthState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    try {
      await authApi.signOut();
    } catch {
      // Ignorar erros de logout
    } finally {
      setAuthState({
        user: null,
        permissions: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  };

  // Atualizar dados do usuario
  const refreshUser = async () => {
    await checkSession();
  };

  // Verificar permissao
  const hasPermission = (permission: keyof Permission): boolean => {
    if (!authState.permissions) return false;
    return authState.permissions[permission] === true;
  };

  // Verificar se e admin
  const isAdmin = (): boolean => {
    return authState.user?.role === 'admin';
  };

  const value: AuthContextType = {
    ...authState,
    login,
    logout,
    refreshUser,
    hasPermission,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
