/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */
const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const {
  getMetroAndroidAssetsResolutionFix,
} = require('react-native-monorepo-tools');

const androidAssetsResolutionFix = getMetroAndroidAssetsResolutionFix();

module.exports = mergeConfig(getDefaultConfig(__dirname), {
  transformer: {
    publicPath: androidAssetsResolutionFix.publicPath,
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
