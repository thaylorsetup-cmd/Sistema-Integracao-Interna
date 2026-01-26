import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import type { Permission } from '@/types';
import { useAuth, getDefaultRoute } from '@/contexts';
import { Loading } from '@/components/ui';

interface ProtectedRouteProps {
  children: ReactNode;
  permission?: keyof Permission;
}

export function ProtectedRoute({ children, permission }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, hasPermission } = useAuth();

  if (isLoading) {
    return <Loading />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (permission && !hasPermission(permission)) {
    return <Navigate to={getDefaultRoute(user.role)} replace />;
  }

  return <>{children}</>;
}
