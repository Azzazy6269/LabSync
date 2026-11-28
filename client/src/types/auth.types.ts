export type UserRole = 'RESEARCHER' | 'ADMIN' | 'SUPERVISOR' | 'MEMBER';

export type UserStatus = 'PENDING_ADMIN_APPROVAL' | 'APPROVED' | 'SUSPENDED' | 'REJECTED';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  nationalId: string;
  jobTitle: string;
  role: UserRole;
  status: UserStatus;
  isEmailVerified: boolean;
  approvedById?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T = undefined> {
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}

export interface SignInData {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RefreshTokenData {
  accessToken: string;
  refreshToken: string;
}