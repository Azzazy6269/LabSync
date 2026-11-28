// src/routes/AppRouter.tsx
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ROUTES } from './paths';
import { PublicOnlyRoute } from './PublicOnlyRoute';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleGuard } from './RoleGuard';

// Auth Pages
let SignInPage; //import { SignInPage } from '../pages/auth/SignInPage';
let SignUpPage; //import { SignUpPage } from '../pages/auth/SignUpPage';


// Status Pages
let SuspendedPage; //import { SuspendedPage } from '../pages/status/SuspendedPage';
let UnauthorizedPage; //import { UnauthorizedPage } from '../pages/status/UnauthorizedPage';


export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path={ROUTES.LOGIN} element={<SignInPage />} />
          <Route path={ROUTES.SIGNUP} element={<SignUpPage />} />
          {/* ForgotPasswordPage , ResetPasswordPage */}
        </Route>


        <Route path={ROUTES.SUSPENDED} element={<SuspendedPage />} />
        <Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path={ROUTES.DASHBOARD} element={<div>Dashboard Page</div>} />
          <Route path={ROUTES.PROFILE} element={<div>Profile Page</div>} />

          <Route element={<RoleGuard allowedRoles={['RESEARCHER']} />}>
            <Route
              path={ROUTES.RESEARCHER_PROJECTS}
              element={<div>Researcher Projects</div>}
            />
          </Route>

          <Route element={<RoleGuard allowedRoles={['SUPERVISOR', 'ADMIN']} />}>
            <Route
              path={ROUTES.SUPERVISOR_REVIEWS}
              element={<div>Supervisor Reviews</div>}
            />
          </Route>

          <Route element={<RoleGuard allowedRoles={['ADMIN']} />}>
            <Route
              path={ROUTES.ADMIN_USERS}
              element={<div>Admin Users Management</div>}
            />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
        <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      </Routes>
    </BrowserRouter>
  );
};