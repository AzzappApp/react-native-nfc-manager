/** @type {import('next').NextConfig} */

const config = {
  swcMinify: true,
  reactStrictMode: true,
  productionBrowserSourceMaps: true,
  experimental: {
    reactRoot: 'concurrent',
  },
  images: {
    disableStaticImages: true,
  },
  webpack: config => {
    config.resolve.extensions = [
      '.web.js',
      '.web.jsx',
      '.web.ts',
      '.web.tsx',
      ...config.resolve.extensions,
    ];
    config.module.rules.push({
      test: /\.(png|jpe?g|gif)$/,
      options: {
        name: '/static/media/[name].[hash:8].[ext]',
        esModule: false,
        scalings: { '@2x': 2, '@3x': 3 },
      },
      loader: 'react-native-web-image-loader',
    });
    return config;
  },
};

const withTM = require('next-transpile-modules')([
  '@azzapp/shared',
  '@azzapp/data',
  '@azzapp/app',
]);

module.exports = withTM(config);
