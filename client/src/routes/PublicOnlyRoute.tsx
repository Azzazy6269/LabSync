import type { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROUTES } from './paths';

interface PublicOnlyRouteProps {
  children?: ReactNode;
}

export const PublicOnlyRoute = ({ children }: PublicOnlyRouteProps) => {
  const { user, authStatus } = useAuth();

  if (authStatus === 'loading') {
    return <div>Loading...</div>;
  }

  if (authStatus === 'unauthenticated') {
    return children ? <>{children}</> : <Outlet />;
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

  return <Navigate to={ROUTES.DASHBOARD} replace />;
};