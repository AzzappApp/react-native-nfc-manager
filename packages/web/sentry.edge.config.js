import * as Sentry from '@sentry/nextjs';

const DNS = process.env.NEXT_PUBLIC_SENTRY_DSN;
const ENVIRONMENT = process.env.NEXT_PUBLIC_PLATFORM || 'development';

const sentryConfigs = {
  development: {
    tracesSampleRate: 1.0,
  },
  staging: {
    tracesSampleRate: 1.0,
  },
  // ADJUST THIS VALUE IN PRODUCTION AFTER BETA
  production: {
    tracesSampleRate: 1.0,
  },
};

Sentry.init({
  dsn: DNS,
  enabled: process.env.NODE_ENV === 'production',
  debug: false,
  ...sentryConfigs[ENVIRONMENT],
});
