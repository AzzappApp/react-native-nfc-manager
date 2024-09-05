const { withSentryConfig } = require('@sentry/nextjs');
const { createVanillaExtractPlugin } = require('@vanilla-extract/next-plugin');
const { withAxiom } = require('next-axiom');

const withVanillaExtract = createVanillaExtractPlugin({
  identifiers: 'short',
});

/** @type {import('next').NextConfig} */
const config = {
  webpack(config, { nextRuntime }) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    if (nextRuntime === 'edge') {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        stream: require.resolve('stream-browserify'),
        path: require.resolve('path-browserify'),
        os: require.resolve('os-browserify/browser'),
      };
    }

    return config;
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    tsconfigPath: './tsconfig.next.json',
    ignoreBuildErrors: true,
  },
  headers() {
    return [
      {
        source: '/.well-known/apple-app-site-association',
        headers: [{ key: 'content-type', value: 'application/json' }],
      },
    ];
  },
  experimental: {
    // TODO wait https://github.com/formatjs/formatjs/issues/3589 or switch back to babel
    // swcPlugins: [
    //   [
    //     '@formatjs/swc-plugin-experimental',
    //     {
    //       removeDefaultMessage: process.env.NODE_ENV === 'production',
    //       idInterpolationPattern: '[sha1:contenthash:base64:6]',
    //     },
    //   ],
    // ],
    // ],
  },
  transpilePackages: ['@azzapp/shared', '@azzapp/data'],
};

module.exports = withAxiom(
  withSentryConfig(
    withVanillaExtract(config),
    {
      // For all available options, see:
      // https://github.com/getsentry/sentry-webpack-plugin#options

      // An auth token is required for uploading source maps.
      authToken: process.env.SENTRY_AUTH_TOKEN,

      // Suppresses source map uploading logs during build
      silent: true,
      org: 'azzapp',
      project: 'web',
    },
    {
      // For all available options, see:
      // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

      // Upload a larger set of source maps for prettier stack traces (increases build time)
      widenClientFileUpload: true,

      // Transpiles SDK to be compatible with IE11 (increases bundle size)
      transpileClientSDK: true,

      // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers (increases server load)
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
  ),
);
