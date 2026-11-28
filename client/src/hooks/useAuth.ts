import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../stores/useAuthStore';
import type { ApiErrorResponse } from '../types/auth.types';
import type {
  SignInInput,
  SignUpInput,
  VerifyOtpInput,
  ResendOtpInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput,
  UpdateProfileInput,
} from '../schemas/auth.schema';

export const authKeys = {
  all: ['auth'] as const,
  profile: () => [...authKeys.all, 'profile'] as const,
};

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    if (data?.message) return data.message;
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
};

export const useAuth = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const profileQuery = useProfile();

  const user = accessToken
    ? profileQuery.data ?? null
    : null;

  const authStatus = !accessToken
    ? 'unauthenticated'
    : user
      ? 'authenticated'
      : profileQuery.isPending
        ? 'loading'
        : 'error';

  return {
    ...profileQuery,
    user,
    authStatus,
    isAuthenticated: authStatus === 'authenticated',
  };
};

export const useProfile = () => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: authKeys.profile(),

    queryFn: async () => {
      const res = await authApi.getProfile();
      return res.data.user;
    },

    enabled: Boolean(accessToken),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
};

export const useSignIn = () => {
  const setTokens = useAuthStore(
    (state) => state.setTokens
  );

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SignInInput) => authApi.signIn(payload),

    onSuccess: (res) => {
      const { user, accessToken, refreshToken } = res.session;

      setTokens(accessToken, refreshToken);

      queryClient.setQueryData(authKeys.profile(), user);
    },
  });
};

export const useSignUp = () => {
  return useMutation({
    mutationFn: (payload: SignUpInput) => authApi.signUp(payload),
  });
};

export const useVerifyOtp = () => {
  return useMutation({
    mutationFn: (payload: VerifyOtpInput) => authApi.verifyOtp(payload),
  });
};

export const useResendOtp = () => {
  return useMutation({
    mutationFn: (payload: ResendOtpInput) => authApi.resendOtp(payload),
  });
};

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (payload: ForgotPasswordInput) => authApi.forgotPassword(payload),
  });
};

export const useResetPassword = () => {
  return useMutation({
    mutationFn: (payload: ResetPasswordInput) => authApi.resetPassword(payload),
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: (payload: ChangePasswordInput) => authApi.changePassword(payload),
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProfileInput) =>
      authApi.updateProfile(payload),

    onSuccess: (res) => {
      queryClient.setQueryData(
        authKeys.profile(),
        res.data.user
      );
    },
  });
};

export const useLogout = () => {
  const logout = useAuthStore((state) => state.logout);
  const queryClient = useQueryClient();

  return () => {
    logout();
    queryClient.clear(); // remove all cached data
  };
};