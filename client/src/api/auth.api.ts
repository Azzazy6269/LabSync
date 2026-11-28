import { api } from './axios';
import type {
  SignUpInput,
  SignInInput,
  VerifyOtpInput,
  ResendOtpInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput,
  UpdateProfileInput,
  RefreshTokenInput,
} from '../schemas/auth.schema';
import type {
  ApiResponse,
  SignInData,
  RefreshTokenData,
  User,
} from '../types/auth.types';

export const authApi = {
  signUp: async (payload: SignUpInput): Promise<ApiResponse<{ user: User }>> => {
    const { data } = await api.post<ApiResponse<{ user: User }>>('/auth/signup', payload);
    return data;
  },

  verifyOtp: async (payload: VerifyOtpInput): Promise<ApiResponse<{ user: User }>> => {
    const { data } = await api.post<ApiResponse<{ user: User }>>('/auth/verify-otp', payload);
    return data;
  },

  resendOtp: async (payload: ResendOtpInput): Promise<{ message: string }> => {
    const { data } = await api.post<{ message: string }>('/auth/resend-otp', payload);
    return data;
  },

  signIn: async (payload: SignInInput): Promise<{ message: string; session: SignInData }> => {
    const { data } = await api.post<ApiResponse<SignInData>>('/auth/signIn', payload);

    const { accessToken, refreshToken, user } = data.data;

    return {
      message: data.message,
      session: {
        accessToken,
        refreshToken,
        user,
      },
    };
  },

  refreshToken: async (payload: RefreshTokenInput): Promise<ApiResponse<RefreshTokenData>> => {
    const { data } = await api.post<ApiResponse<RefreshTokenData>>('/auth/refresh-token', payload);
    return data;
  },

  forgotPassword: async (payload: ForgotPasswordInput): Promise<{ message: string }> => {
    const { data } = await api.post<{ message: string }>('/auth/forgot-password', payload);
    return data;
  },

  resetPassword: async (payload: ResetPasswordInput): Promise<{ message: string }> => {
    const { data } = await api.post<{ message: string }>('/auth/reset-password', payload);
    return data;
  },

  changePassword: async (payload: ChangePasswordInput): Promise<{ message: string }> => {
    const { data } = await api.patch<{ message: string }>('/auth/change-password', payload);
    return data;
  },

  getProfile: async (): Promise<ApiResponse<{ user: User }>> => {
    const { data } = await api.get<ApiResponse<{ user: User }>>('/auth/me');
    return data;
  },

  updateProfile: async (payload: UpdateProfileInput): Promise<ApiResponse<{ user: User }>> => {
    const { data } = await api.patch<ApiResponse<{ user: User }>>('/auth/me', payload);
    return data;
  },
};