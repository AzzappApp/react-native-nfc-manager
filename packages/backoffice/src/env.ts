import { z } from 'zod';

export const schema = z.object({
  NEXT_PUBLIC_API_ENDPOINT: z
    .string()
    .url()
    .default('https://api.dev.azzapp.com')
    .describe('API endpoint for the web application'),
  CRON_SECRET: z.string().default('').describe('Secret for cron jobs'),
  NEXT_PUBLIC_SENTRY_DSN: z
    .string()
    .url()
    .optional()
    .describe('Sentry DSN for error tracking'),
  NEXT_PUBLIC_PLATFORM: z
    .enum(['production', 'staging', 'development'])
    .default('development')
    .describe('Deployment environment'),
  SECRET_COOKIE_PASSWORD: z
    .string()
    .default('')
    .describe('Secret for cookie encryption'),
});

const env = schema.safeParse(process.env);

if (!env.success) {
  console.error(
    '❌ backoffice - invalid environment variables:',
    env.error.format(),
  );
}

export default env.data!;
