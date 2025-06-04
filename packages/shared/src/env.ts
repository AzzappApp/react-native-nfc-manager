import { z } from 'zod';

export const schema = z.object({
  NEXT_PUBLIC_URL: z
    .string()
    .url()
    .default('https://dev.azzapp.com/')
    .describe('Base URL for the web application'),
  NEXT_PUBLIC_AZZAPP_WEBSITE: z
    .string()
    .url()
    .default('https://web.azzapp.com')
    .describe('Base URL for the web site'),
  AZZAPP_SUPPORT_EMAIL: z
    .string()
    .email()
    .default('support@azzapp.com')
    .describe('Support email for the application'),
});

const env = schema.safeParse(process.env);

if (!env.success) {
  console.error(
    '❌ shared - invalid environment variables:',
    env.error.format(),
  );
}

export default env.data!;
