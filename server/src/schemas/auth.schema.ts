import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty').optional(),
  email: z.string().email('Invalid email address').optional(),
  mobile: z
    .string()
    .regex(/^\+?[0-9]{7,15}$/, 'Invalid mobile phone number format')
    .optional()
    .or(z.literal('')) // Allow clearing the phone number
    .nullable(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters long'),
    confirmNewPassword: z.string().min(1, 'Confirm new password is required'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'New passwords do not match',
    path: ['confirmNewPassword'],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const verify2faSchema = z.object({
  secret: z.string().min(1, 'Secret key is required to activate'),
  code: z.string().length(6, 'Verification code must be exactly 6 digits'),
});

export const login2faSchema = z.object({
  tempToken: z.string().min(1, 'Temporary session token is required'),
  code: z.string().length(6, 'Verification code must be exactly 6 digits'),
});
