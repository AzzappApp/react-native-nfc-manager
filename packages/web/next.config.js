const path = require('path');
const { createVanillaExtractPlugin } = require('@vanilla-extract/next-plugin');
const relayArtifactDirectory = path.join(
  path.dirname(require.resolve('@azzapp/relay/package.json')),
  'artifacts',
);

const withVanillaExtract = createVanillaExtractPlugin();

/** @type {import('next').NextConfig} */
const config = {
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

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
    serverActions: true,
  },
  transpilePackages: ['@azzapp/shared/', '@azzapp/data', '@azzapp/relay'],
};

module.exports = withVanillaExtract(config);
