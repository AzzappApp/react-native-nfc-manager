/**
 * Metro configuration for React Native
 * https://reactnative.dev/docs/metro
 *
 * @format
 */
const path = require('path');
const { mergeConfig } = require('@react-native/metro-config');

const { getSentryExpoConfig } = require('@sentry/react-native/metro');
const {
  getMetroAndroidAssetsResolutionFix,
} = require('react-native-monorepo-tools');

const androidAssetsResolutionFix = getMetroAndroidAssetsResolutionFix();

module.exports = mergeConfig(getSentryExpoConfig(__dirname), {
  transformer: {
    publicPath: androidAssetsResolutionFix.publicPath,
    assetPlugins: ['expo-asset/tools/hashAssetFiles'],
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  server: {
    // ...and to the server middleware.
    enhanceMiddleware: middleware => {
      return androidAssetsResolutionFix.applyMiddleware(middleware);
    },
  },
  watchFolders: [path.resolve(__dirname, '../../')],
});
