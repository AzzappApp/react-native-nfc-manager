const path = require('path');
const relayArtifactDirectory = path.join(
  path.dirname(require.resolve('@azzapp/relay/package.json')),
  'artifacts',
);

/** @type {import('next').NextConfig} */
module.exports = {
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
  },
  transpilePackages: ['@azzapp/shared/', '@azzapp/data', '@azzapp/relay'],
};
