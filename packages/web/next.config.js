const path = require('path');
const { withSentryConfig } = require('@sentry/nextjs');
const { createVanillaExtractPlugin } = require('@vanilla-extract/next-plugin');
const relayArtifactDirectory = path.join(
  path.dirname(require.resolve('@azzapp/relay/package.json')),
  'artifacts',
);

const withVanillaExtract = createVanillaExtractPlugin();

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
  compiler: {
    relay: {
      src: './src',
      artifactDirectory: relayArtifactDirectory,
      language: 'typescript',
      eagerEsModules: false,
    },
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
  transpilePackages: ['@azzapp/shared/', '@azzapp/data', '@azzapp/relay'],
  sentry: {
    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Transpiles SDK to be compatible with IE11 (increases bundle size)
    transpileClientSDK: false,

    // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers (increases server load)
    tunnelRoute: '/monitoring',

    // Hides source maps from generated client bundles
    hideSourceMaps: true,

    authToken: process.env.SENTRY_AUTH_TOKEN,
  },
};

const sentryWebpackPluginOptions = {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  // Suppresses source map uploading logs during build
  silent: true,

  org: 'azzapp',
  project: 'web',
};

module.exports = withSentryConfig(
  withVanillaExtract(config),
  sentryWebpackPluginOptions,
);
