/** @type {import('next').NextConfig} */

const { withSentryConfig } = require('@sentry/nextjs');

const remotePatterns = [];

if (process.env.NEXT_PUBLIC_URL) {
  const url = new URL(process.env.NEXT_PUBLIC_URL);
  remotePatterns.push({
    protocol: url.protocol.replace(':', ''),
    hostname: url.hostname,
    port: url.port,
    pathname: '/api/cover/**',
  });
}

const config = {
  productionBrowserSourceMaps: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    tsconfigPath: './tsconfig.next.json',
    ignoreBuildErrors: true,
  },
  transpilePackages: ['@azzapp/shared', '@azzapp/data'],
  modularizeImports: {
    '@mui/icons-material': {
      transform: '@mui/icons-material/{{member}}',
    },
  },
  images: {
    remotePatterns,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
};

// Injected content via Sentry wizard below

module.exports = withSentryConfig(
  config,
  {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options

    authToken: process.env.SENTRY_AUTH_TOKEN,

    // Suppresses source map uploading logs during build
    silent: true,
    org: 'azzapp',
    project: 'backoffice',
  },
  {
    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Transpiles SDK to be compatible with IE11 (increases bundle size)
    transpileClientSDK: true,

    // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
    // This can increase your server load as well as your hosting bill.
    // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
    // side errors will fail.
    tunnelRoute: '/_monitoring',

    // Hides source maps from generated client bundles
    hideSourceMaps: true,

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,

    // Enables automatic instrumentation of Vercel Cron Monitors.
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,
  },
);
