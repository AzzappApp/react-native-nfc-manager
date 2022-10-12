const path = require('path');

const relayArtifactDirectory = path.join(
  path.dirname(require.resolve('@azzapp/relay/package.json')),
  'artifacts',
);
module.exports = {
  presets: [
    [
      'module:metro-react-native-babel-preset',
      {
        unstable_transformProfile: 'hermes-stable',
      },
    ],
  ],
  plugins: [
    // TODO allowList to avoid bad env injected ?
    ['module:react-native-dotenv', { moduleName: 'process.env' }],
    ['relay', { artifactDirectory: relayArtifactDirectory }],
    [
      'formatjs',
      {
        removeDefaultMessage: process.env.NODE_ENV === 'production',
        idInterpolationPattern: '[sha1:contenthash:base64:6]',
      },
    ],
    'react-native-reanimated/plugin',
  ],
};
