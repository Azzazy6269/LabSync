import type { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { ROUTES } from './paths';

interface PublicOnlyRouteProps {
  children?: ReactNode;
}

export const PublicOnlyRoute = ({ children }: PublicOnlyRouteProps) => {
  const { isAuthenticated, accessToken, user } = useAuthStore();

  if (isAuthenticated && accessToken && user) {
    if (user.status === 'SUSPENDED') {
      return <Navigate to={ROUTES.SUSPENDED} replace />;
    }

    if (!user.isEmailVerified) {
      return (
        <Navigate
          to={ROUTES.LOGIN}
          state={{ email: user.email }}
          replace
        />
      );
    }

    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};