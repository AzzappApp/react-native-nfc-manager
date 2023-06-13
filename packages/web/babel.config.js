const path = require('path');

const relayArtifactDirectory = path.join(
  path.dirname(require.resolve('@azzapp/relay/package.json')),
  'artifacts',
);

module.exports = {
  presets: ['next/babel'],
  plugins: [
    ['relay', { artifactDirectory: relayArtifactDirectory }],
    [
      'formatjs',
      {
        removeDefaultMessage: process.env.NODE_ENV === 'production',
        idInterpolationPattern: '[sha1:contenthash:base64:6]',
      },
    ],
    '@babel/plugin-proposal-private-methods',
  ],
};
