const path = require('path');

const relayArtifactDirectory = path.join(
  path.dirname(require.resolve('@azzapp/relay/package.json')),
  'artifacts',
);

module.exports = {
  presets: ['next/babel'],
  plugins: [
    ['react-native-web', { commonjs: true }],
    ['relay', { artifactDirectory: relayArtifactDirectory }],
    [
      'formatjs',
      {
        removeDefaultMessage: process.env.NODE_ENV === 'production',
        idInterpolationPattern: '[sha1:contenthash:base64:6]',
      },
    ],
  ],
};
