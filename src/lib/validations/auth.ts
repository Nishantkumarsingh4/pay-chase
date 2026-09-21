import { z } from 'zod';

const COMMON_PASSWORDS = new Set([
  'password',
  'password123',
  '12345678',
  '123456789',
  'qwerty123',
  'admin123',
  'letmein123',
  'welcome123',
  'iloveyou',
]);

export const nameSchema = z
  .string()
  .trim()
  .min(2, 'Name must be at least 2 characters')
  .max(60, 'Name cannot exceed 60 characters')
  .refine((val) => !/\d/.test(val), 'Name cannot contain numbers')
  .refine((val) => /^[a-zA-Z\s.'-]+$/.test(val), 'Name can only contain letters and spaces');

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Please enter a valid email address')
  .max(254, 'Email cannot exceed 254 characters');

export const passwordBaseSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password cannot exceed 72 characters')
  .regex(/[a-zA-Z]/, 'Password must include at least one letter')
  .regex(/[0-9]/, 'Password must include at least one number');

export const signupSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordBaseSchema,
    confirmPassword: z.string(),
    honeypot: z.string().optional(),
  })
  .strict()
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => !COMMON_PASSWORDS.has(data.password.toLowerCase()), {
    message: 'This password is too common. Please choose a stronger password',
    path: ['password'],
  })
  .refine(
    (data) =>
      data.password.toLowerCase() !== data.email.toLowerCase() &&
      data.password.toLowerCase() !== data.name.toLowerCase(),
    {
      message: 'Password cannot be your name or email',
      path: ['password'],
    }
  );

export const loginSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required'),
    callbackUrl: z.string().optional(),
  })
  .strict();

export const forgotPasswordSchema = z
  .object({
    email: emailSchema,
    honeypot: z.string().optional(),
  })
  .strict();

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    password: passwordBaseSchema,
    confirmPassword: z.string(),
  })
  .strict()
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => !COMMON_PASSWORDS.has(data.password.toLowerCase()), {
    message: 'This password is too common. Please choose a stronger password',
    path: ['password'],
  });

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
