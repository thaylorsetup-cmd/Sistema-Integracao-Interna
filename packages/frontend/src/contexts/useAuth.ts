import { useContext } from 'react';
import { AuthContext } from './AuthContext';
import type { Permission } from '@/types';

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook helper para verificar permissões específicas
export function usePermission(permission: keyof Permission): boolean {
  const { hasPermission } = useAuth();
  return hasPermission(permission);
}

// Hook helper para verificar se é admin
export function useIsAdmin(): boolean {
  const { isAdmin } = useAuth();
  return isAdmin();
}
