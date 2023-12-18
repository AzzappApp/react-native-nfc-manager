const path = require('path');
const { createTransformer } = require('babel-jest');

const relayArtifactDirectory = path.join(
  path.dirname(require.resolve('@azzapp/relay/package.json')),
  'artifacts',
);
module.exports = createTransformer({
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }],
    '@babel/plugin-proposal-export-namespace-from',
    [
      'relay',
      { eagerEsModules: false, artifactDirectory: relayArtifactDirectory },
    ],
    ['formatjs', { idInterpolationPattern: '[sha1:contenthash:base64:6]' }],
  ],
});
