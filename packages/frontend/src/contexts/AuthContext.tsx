import { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { AuthState, User, Permission } from '@/types';
import { autenticarUsuario, adicionarLog, getPermissoesPorRole } from '@/services/mockDatabase';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, name: string) => Promise<void>;
  hasPermission: (permission: keyof Permission) => boolean;
  isAdmin: () => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Carregar token do localStorage ao iniciar
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        // Reconstruir permissões baseadas no role
        user.permissions = getPermissoesPorRole(user.role);
        setAuthState({
          user,
          token,
          isLoading: false,
          isAuthenticated: true,
        });
      } catch {
        // Se falhar ao parsear, limpar storage
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
        }));
      }
    } else {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
      }));
    }
  }, []);

  const login = async (email: string, password: string) => {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 500));

    const usuario = autenticarUsuario(email, password);

    if (!usuario) {
      throw new Error('Credenciais inválidas');
    }

    // Gerar token mock
    const token = `mock-token-${usuario.id}-${Date.now()}`;

    // Salvar no localStorage
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(usuario));

    // Registrar log de login
    adicionarLog({
      usuarioId: usuario.id,
      usuarioNome: usuario.name,
      tipo: 'LOGIN',
      modulo: 'Autenticação',
      descricao: 'Login realizado com sucesso',
    });

    setAuthState({
      user: usuario,
      token,
      isLoading: false,
      isAuthenticated: true,
    });
  };

  const logout = () => {
    // Registrar log de logout se houver usuário
    if (authState.user) {
      adicionarLog({
        usuarioId: authState.user.id,
        usuarioNome: authState.user.name,
        tipo: 'LOGOUT',
        modulo: 'Autenticação',
        descricao: 'Logout realizado',
      });
    }

    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setAuthState({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
    });
  };

  const register = async (email: string, password: string, name: string) => {
    // TODO: Implementar registro quando houver backend
    console.log('Register:', email, password, name);
    throw new Error('Registro não disponível. Contate o administrador.');
  };

  const hasPermission = (permission: keyof Permission): boolean => {
    if (!authState.user) return false;
    return authState.user.permissions[permission] === true;
  };

  const isAdmin = (): boolean => {
    return authState.user?.role === 'admin';
  };

  const value: AuthContextType = {
    ...authState,
    login,
    logout,
    register,
    hasPermission,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
