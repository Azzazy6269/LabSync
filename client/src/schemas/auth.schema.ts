import { z } from 'zod';

const egyptianPhoneRegex = /^01[0125][0-9]{8}$/;
const nationalIdRegex = /^[0-9]{14}$/;
const otpRegex = /^[0-9]{6}$/;

export const userRoleSchema = z.enum(['RESEARCHER', 'ADMIN', 'SUPERVISOR']);

// 1. Sign Up Schema
export const signUpSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(3, 'Full name must be at least 3 characters long')
      .max(100, 'Full name must not exceed 100 characters'),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('Please provide a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .max(100, 'Password must not exceed 100 characters'),
    repeatPassword: z.string().min(1, 'Please confirm your password'),
    phone: z
      .string()
      .trim()
      .regex(
        egyptianPhoneRegex,
        'Please enter a valid Egyptian phone number (11 digits starting with 01)'
      ),
    nationalId: z
      .string()
      .trim()
      .regex(nationalIdRegex, 'National ID must be exactly 14 digits'),
    jobTitle: z
      .string()
      .trim()
      .min(2, 'Job title must be at least 2 characters long')
      .max(100, 'Job title must not exceed 100 characters'),
    role: userRoleSchema.optional(),
  })
  .refine((data) => data.password === data.repeatPassword, {
    message: 'Passwords do not match',
    path: ['repeatPassword'],
  });

// 2. Sign In Schema
export const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please provide a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

// 3. Verify OTP Schema
export const verifyOtpSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please provide a valid email address'),
  otp: z
    .string()
    .trim()
    .regex(otpRegex, 'OTP must be exactly 6 digits'),
});

// 4. Resend OTP Schema
export const resendOtpSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please provide a valid email address'),
});

// 5. Forgot Password Schema
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please provide a valid email address'),
});

// 6. Reset Password Schema
export const resetPasswordSchema = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('Please provide a valid email address'),
    otp: z
      .string()
      .trim()
      .regex(otpRegex, 'OTP must be 6 digits'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .max(100),
    repeatNewPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.repeatNewPassword, {
    message: 'Passwords do not match',
    path: ['repeatNewPassword'],
  });

// 7. Change Password Schema
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters long')
      .max(100),
    repeatNewPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  })
  .refine((data) => data.newPassword === data.repeatNewPassword, {
    message: 'Passwords do not match',
    path: ['repeatNewPassword'],
  });

// 8. Update Profile Schema
export const updateProfileSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(3, 'Full name must be at least 3 characters long')
      .max(100)
      .optional(),
    phone: z
      .string()
      .trim()
      .regex(
        egyptianPhoneRegex,
        'Please enter a valid Egyptian phone number (11 digits starting with 01)'
      )
      .optional(),
    jobTitle: z
      .string()
      .trim()
      .min(2, 'Job title must be at least 2 characters long')
      .max(100)
      .optional(),
  })
  .refine(
    (data) =>
      data.fullName !== undefined ||
      data.phone !== undefined ||
      data.jobTitle !== undefined,
    {
      message: 'Please provide at least one field to update (fullName, phone, or jobTitle)',
    }
  );

// 9. Refresh Token Schema
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// ================= Inferred DTO Types =================
export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type ResendOtpInput = z.infer<typeof resendOtpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;