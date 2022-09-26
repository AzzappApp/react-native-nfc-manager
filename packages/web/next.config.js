/** @type {import('next').NextConfig} */

const i18nConfig = require('@azzapp/i18n');

const config = {
  swcMinify: true,
  productionBrowserSourceMaps: true,
  images: {
    disableStaticImages: true,
  },
  i18n: {
    locales: i18nConfig.SUPPORTED_LOCALES,
    defaultLocale: i18nConfig.DEFAULT_LOCALE,
  },
  webpack: config => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'react-native$': 'react-native-web',

      'react-native-linear-gradient': 'react-native-web-linear-gradient',
    };
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
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ['@svgr/webpack'],
    });

    return config;
  },
};

const withTM = require('next-transpile-modules')([
  '@azzapp/shared',
  '@azzapp/data',
  '@azzapp/app',
  '@azzapp/relay',
  'react-native-web-linear-gradient',
  'react-native-safe-area-context',
  'react-native-svg',
  'validator',
]);

module.exports = withTM(config);
