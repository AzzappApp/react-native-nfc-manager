const path = require('path');
const { createTransformer } = require('babel-jest');

const relayArtifactDirectory = path.join(
  path.dirname(require.resolve('@azzapp/relay/package.json')),
  'artifacts',
);
module.exports = createTransformer({
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }],
    [
      'relay',
      { eagerEsModules: false, artifactDirectory: relayArtifactDirectory },
    ],
  ],
});
