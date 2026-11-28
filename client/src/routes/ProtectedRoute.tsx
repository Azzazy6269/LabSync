import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROUTES } from './paths';

interface ProtectedRouteProps {
  children?: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation();
  const { user, authStatus } = useAuth();

  if (authStatus === 'loading') {
    return <div>Loading...</div>;
  }

  if (authStatus === 'unauthenticated') {
    return (
      <Navigate
        to={ROUTES.LOGIN}
        state={{ from: location }}
        replace
      />
    );
  }

  if (authStatus === 'error' || !user) {
    return <div>Unable to verify your session. Please try again.</div>;
  }

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

  return children ? <>{children}</> : <Outlet />;
};