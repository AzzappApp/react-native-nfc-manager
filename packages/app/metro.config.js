/**
 * Metro configuration for React Native
 * https://reactnative.dev/docs/metro
 *
 * @format
 */
const path = require('path');
const { mergeConfig, getDefaultConfig } = require('@react-native/metro-config');

const { getSentryExpoConfig } = require('@sentry/react-native/metro');

const nativeClientAliases = {
  crypto: 'react-native-quick-crypto',
  'node:crypto': 'react-native-quick-crypto',
  'expo-crypto': 'react-native-quick-crypto',
  'base64-js': 'react-native-quick-base64',
  base64: 'react-native-quick-base64',
  'js-base64': 'react-native-quick-base64',
};

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
  resolver: {
    resolveRequest: (context, moduleName, platform) => {
      if (nativeClientAliases[moduleName]) {
        return context.resolveRequest(
          context,
          nativeClientAliases[moduleName],
          platform,
        );
      }
      // otherwise chain to the standard Metro resolver.
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(
  getDefaultConfig(__dirname),
  getSentryExpoConfig(__dirname),
  config,
);
