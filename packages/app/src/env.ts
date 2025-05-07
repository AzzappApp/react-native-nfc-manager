import { z } from 'zod';

export const schema = z.object({
  NEXT_PUBLIC_API_ENDPOINT: z
    .string()
    .url()
    .default('https://api.dev.azzapp.com')
    .describe('API endpoint for the web application'),
  AZZAPP_API_VERCEL_PROTECTION_BYPASS: z
    .string()
    .optional()
    .default('')
    .describe('Bypass for Vercel protection'),
  WIDGET_APP_GROUP: z.string().default('azzapp').describe('Widget app group'),
  APP_WEBSHARED_CREDENTIALS: z
    .string()
    .default('dev.azzapp.com')
    .describe('App web shared credentials'),
  TERMS_OF_SERVICE: z
    .string()
    .url()
    .default('https://web.azzapp.com/legal/terms-of-service')
    .describe('Terms of service URL'),
  PRIVACY_POLICY: z
    .string()
    .url()
    .default('https://web.azzapp.com/legal/privacy')
    .describe('Privacy policy URL'),
  ABOUT: z
    .string()
    .url()
    .default('https://web.azzapp.com/company/about_us')
    .describe('About us URL'),
  FAQ: z
    .string()
    .url()
    .default('https://web.azzapp.com/company/faq')
    .describe('FAQ URL'),
  APP_SCHEME: z
    .string()
    .default('azzapp-dev')
    .describe('App scheme for deep linking'),
  PURCHASE_IOS_KEY: z.string().default('').describe('iOS purchase key'),
  PURCHASE_ANDROID_KEY: z.string().default('').describe('Android purchase key'),
  SENTRY_DSN: z
    .string()
    .url()
    .optional()
    .describe('Sentry DSN for error tracking'),
  DEPLOYMENT_ENVIRONMENT: z
    .enum(['production', 'staging', 'development'])
    .default('development')
    .describe('Deployment environment'),
});

const env = schema.safeParse({
  NEXT_PUBLIC_API_ENDPOINT: process.env.NEXT_PUBLIC_API_ENDPOINT,
  AZZAPP_API_VERCEL_PROTECTION_BYPASS:
    process.env.AZZAPP_API_VERCEL_PROTECTION_BYPASS,
  WIDGET_APP_GROUP: process.env.WIDGET_APP_GROUP,
  APP_WEBSHARED_CREDENTIALS: process.env.APP_WEBSHARED_CREDENTIALS,
  TERMS_OF_SERVICE: process.env.TERMS_OF_SERVICE,
  PRIVACY_POLICY: process.env.PRIVACY_POLICY,
  ABOUT: process.env.ABOUT,
  FAQ: process.env.FAQ,
  APP_SCHEME: process.env.APP_SCHEME,
  PURCHASE_IOS_KEY: process.env.PURCHASE_IOS_KEY,
  PURCHASE_ANDROID_KEY: process.env.PURCHASE_ANDROID_KEY,
  SENTRY_DSN: process.env.SENTRY_DSN,
  DEPLOYMENT_ENVIRONMENT: process.env.DEPLOYMENT_ENVIRONMENT,
});

if (!env.success) {
  console.error('❌ app - invalid environment variables:', env.error.format());
}

export default env.data!;
