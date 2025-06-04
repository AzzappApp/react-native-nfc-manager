// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';
import env from '#env';

const DNS = env.NEXT_PUBLIC_SENTRY_DSN;
const ENVIRONMENT = env.NEXT_PUBLIC_PLATFORM || 'development';

Sentry.init({
  dsn: DNS,

  environment: ENVIRONMENT,

  enabled: process.env.NODE_ENV !== 'development',

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: process.env.NODE_ENV === 'development',
});
