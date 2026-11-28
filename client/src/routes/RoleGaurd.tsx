import type { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { UserRole } from '../types/auth.types';
import { ROUTES } from './paths';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  redirectTo?: string;
  children?: ReactNode;
}

export const RoleGuard = ({
  allowedRoles,
  redirectTo = ROUTES.UNAUTHORIZED,
  children,
}: RoleGuardProps) => {
  const { user, authStatus } = useAuth();

  if (authStatus === 'loading') {
    return <div>Loading...</div>;
  }

  if (authStatus !== 'authenticated' || !user) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

interface RoleGateProps {
  allowedRoles: UserRole[];
  fallback?: ReactNode;
  children: ReactNode;
}

export const RoleGate = ({
  allowedRoles,
  fallback = null,
  children,
}: RoleGateProps) => {
  const { user, authStatus } = useAuth();

  if (authStatus === 'loading') {
    return null;
  }

  if (
    authStatus !== 'authenticated' ||
    !user ||
    !allowedRoles.includes(user.role)
  ) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};