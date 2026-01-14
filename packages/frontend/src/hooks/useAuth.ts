// import { useContext } from 'react';

/**
 * Hook para acessar contexto de autenticação
 * @example
 * const { user, isAuthenticated, logout } = useAuth();
 */
export function useAuth() {
  // TODO: Implementar contexto de autenticação
  // const context = useContext(AuthContext);
  // if (!context) {
  //   throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  // }
  // return context;

  // Placeholder
  return {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: async () => {},
    logout: () => {},
    token: null,
  };
}
