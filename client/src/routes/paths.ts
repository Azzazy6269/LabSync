export const ROUTES = {
  // Public / Auth
  LOGIN: '/login',
  SIGNUP: '/signup',
  VERIFY_OTP: '/verify-otp',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',

  // Account Status & Errors
  SUSPENDED: '/suspended',
  UNAUTHORIZED: '/unauthorized',

  // Protected (Shared)
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',

  // Role-Specific Examples
  RESEARCHER_PROJECTS: '/researcher/projects',
  SUPERVISOR_REVIEWS: '/supervisor/reviews',
  ADMIN_USERS: '/admin/users',
} as const;