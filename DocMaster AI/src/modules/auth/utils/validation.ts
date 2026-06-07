import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(100),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  phone: z.string().min(8, 'Phone number must be at least 8 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const profileSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  phone: z.string().min(8, 'Phone number must be at least 8 characters'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
