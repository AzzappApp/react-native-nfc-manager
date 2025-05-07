import * as Sentry from '@sentry/react-native';
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

const usedEnvVars = {
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
};

Sentry.init({
  dsn: usedEnvVars.SENTRY_DSN,
  enabled: !__DEV__,
  environment: usedEnvVars.DEPLOYMENT_ENVIRONMENT,
  // TODO better configuration based on environment
  // WARNING: This option interferes with reanimated and creates flickering in some animations
  // do not enable it unless it has been fixed
  enableStallTracking: false,
  tracesSampleRate:
    usedEnvVars.DEPLOYMENT_ENVIRONMENT === 'production' ? 0.1 : 1,
  // DO NOT REENABLE THIS UNTIL IT DOES NOT CRASH THE APP ANYMORE
  // see https://github.com/getsentry/sentry-java/issues/2604#issuecomment-1524566544
  profilesSampleRate: 0,
});

const env = schema.safeParse(usedEnvVars);

if (!env.success) {
  Sentry.captureMessage('❌ app - invalid environment variables: ', {
    level: 'fatal',
    extra: {
      error: env.error.format(),
    },
  });
  console.error('❌ app - invalid environment variables:', env.error.format());
}

export default env.data!;
