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
        useTransformReactJSXExperimental: true,
        unstable_transformProfile: 'hermes-stable',
      },
    ],
  ],
  plugins: [
    ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }],
    // TODO allowList to avoid bad env injected ?
    ['module:react-native-dotenv', { moduleName: 'process.env' }],
    ['relay', { artifactDirectory: relayArtifactDirectory }],
    'react-native-reanimated/plugin',
    [
      'formatjs',
      {
        removeDefaultMessage: process.env.NODE_ENV === 'production',
        idInterpolationPattern: '[sha1:contenthash:base64:6]',
      },
    ],
  ],
};
