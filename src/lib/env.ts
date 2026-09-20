import { z } from 'zod';

const envSchema = z.object({
  DB_HOST: z.string().default('127.0.0.1'),
  DB_PORT: z.coerce.number().default(3306),
  DB_USER: z.string().default('root'),
  DB_PASSWORD: z.string().default(''),
  DB_NAME: z.string().default('animated_db'),
  NEXTAUTH_SECRET: z.string().min(16, 'NEXTAUTH_SECRET must be at least 16 characters'),
  NEXTAUTH_URL: z.string().url().default('http://localhost:3000'),
  APP_URL: z.string().url().default('http://localhost:3000'),
  RESEND_API_KEY: z.string().optional().default('re_placeholder'),
  EMAIL_FROM: z.string().default('PayChase <onboarding@resend.dev>'),
});

export const env = envSchema.parse(process.env);
