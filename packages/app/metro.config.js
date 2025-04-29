/**
 * Metro configuration for React Native
 * https://reactnative.dev/docs/metro
 *
 * @format
 */
const path = require('path');
const { mergeConfig, getDefaultConfig } = require('@react-native/metro-config');

const { getSentryExpoConfig } = require('@sentry/react-native/metro');

const config = {
  transformer: {
    assetPlugins: ['expo-asset/tools/hashAssetFiles'],
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  server: {
    unstable_serverRoot: __dirname,
  },
  watchFolders: [path.resolve(__dirname, '../../')],
  resolveRequest: (context, moduleName, platform) => {
    if (moduleName === 'crypto') {
      // when importing crypto, resolve to react-native-quick-crypto
      return context.resolveRequest(
        context,
        'react-native-quick-crypto',
        platform,
      );
    }
    // otherwise chain to the standard Metro resolver.
    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = mergeConfig(
  getDefaultConfig(__dirname),
  getSentryExpoConfig(__dirname),
  config,
);
