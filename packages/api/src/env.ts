import { z } from 'zod';

export const schema = z.object({
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional().describe('Sentry DSN'),
  NEXT_PUBLIC_PLATFORM: z
    .string()
    .default('development')
    .describe('Platform environment'),
  GOOGLE_PASS_CREDENTIALS: z
    .string()
    .default('')
    .describe('Google pass credentials used to sign passes'),
  GOOGLE_PASS_ISSUER_ID: z
    .string()
    .default('')
    .describe('Google pass issuer ID used to sign passes'),
  GOOGLE_CLIENT_ID: z
    .string()
    .default('')
    .describe('Google client ID used to signin'),
  GOOGLE_CLIENT_SECRET: z
    .string()
    .default('')
    .describe('Google client secret used to signin'),
  GOOGLE_TOKEN_SECRET: z
    .string()
    .default('')
    .describe('Google token secret used to signin'),
  CRON_SECRET: z
    .string()
    .default('')
    .describe('Secret to protect the cron job'),
  LAST_SUPPORTED_APP_VERSION: z
    .string()
    .default('1.0.0')
    .describe('Last supported app version'),
  INNGEST_SIGNING_KEY: z.string().default('').describe('Inngest signing key'),
  APPLE_CLIENT_ID: z
    .string()
    .default('')
    .describe('Apple client ID used to signin'),
  APPLE_KEY_ID: z.string().default('').describe('Apple key ID used to signin'),
  APPLE_PRIVATE_KEY: z
    .string()
    .default('')
    .describe('Apple private key used to signin'),
  APPLE_TEAM_IDENTIFIER: z
    .string()
    .default('')
    .describe('Apple team identifier'),
  APPLE_TOKEN_SECRET: z
    .string()
    .default('')
    .describe('Apple token secret used to signin'),
  LINKEDIN_CLIENT_ID: z
    .string()
    .default('')
    .describe('Linkedin client ID used to signin'),
  LINKEDIN_CLIENT_SECRET: z
    .string()
    .default('')
    .describe('Linkedin client secret used to signin'),
  LINKEDIN_TOKEN_SECRET: z
    .string()
    .default('')
    .describe('Linkedin token secret used to signin'),
  VERCEL_AUTOMATION_BYPASS_SECRET: z
    .string()
    .default('')
    .describe('Vercel automation bypass secret'),
  NEXT_PUBLIC_USER_MGMT_URL: z
    .string()
    .url()
    .default('https://user.azzapp.com')
    .describe('URL for the user management service'),
  TOKEN_SECRET: z
    .string()
    .default('')
    .describe('Secret used to sign auth tokens'),
  REFRESH_TOKEN_SECRET: z
    .string()
    .default('')
    .describe('Secret used to sign refresh tokens'),
  APPLE_PASS_SIGNER_CERT: z
    .string()
    .default('')
    .describe('Apple pass signer certificate used to sign passes'),
  APPLE_PASS_SIGNER_KEY: z
    .string()
    .default('')
    .describe('Apple pass signer key used to sign passes'),
  APPLE_PASS_SIGNER_KEY_PASSPHRASE: z
    .string()
    .default('')
    .describe('Apple pass signer key passphrase used to sign passes'),
  APPLE_PASS_IDENTIFIER: z
    .string()
    .default('')
    .describe('Apple pass identifier for azzapp passes'),
  APPLE_PASS_WWDR: z
    .string()
    .default('')
    .describe('Apple pass WWDR certificate used to sign passes'),
  APPLE_TOKEN_PASSWORD: z
    .string()
    .default('')
    .describe('Password used to encrypt the token for Apple Pass'),
  APPLE_ORGANIZATION_NAME: z
    .string()
    .default('')
    .describe('Organization name of Azzapp for Apple'),
  WEBCARD_NOTIFICATION_DELAY: z
    .string()
    .default('5m')
    .describe(
      'Delay before sending the webcard notification (to avoid sending too many notifications for subsequent updates)',
    ),
  MEDIA_DELETION_SLOT_SIZE: z
    .string()
    .default('10')
    .describe('Slot size for media deletion'),
  API_LOG_LEVEL: z
    .enum(['debug', 'info', 'warn', 'error', 'silent'])
    .optional()
    .describe('Log level for the API'),
  JWT_SECRET: z
    .string()
    .default('')
    .describe('Secret used to sign JWT tokens for shareback'),
  IAP_REVENUECAT_NOTIFICATION_BEARER: z
    .string()
    .default('')
    .describe(
      'Bearer token used to authenticate the IAP RevenueCat notification',
    ),
});

const env = schema.safeParse(process.env);

if (!env.success) {
  console.error('❌ api - invalid environment variables:', env.error.format());
}

export default env.data!;
