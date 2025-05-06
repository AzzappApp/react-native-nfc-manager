const path = require('path');
const {
  default: resolvePath,
} = require('babel-plugin-module-resolver/lib/resolvePath');

const relayArtifactDirectory = path.join(
  path.dirname(require.resolve('@azzapp/app/package.json')),
  'src/relayArtifacts',
);

module.exports = {
  presets: [
    [
      'module:@react-native/babel-preset',
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
      'module-resolver',
      {
        alias: {
          '^#(.+)': './src/\\1',
          '@azzapp/shared': '../shared/src',
        },
        resolvePath(sourcePath, currentFile, opts) {
          if (sourcePath.endsWith('.relayprovider')) {
            const name = sourcePath.split('/').pop();
            return resolvePath(`#relayProviders/${name}`, currentFile, opts);
          }
          return resolvePath(sourcePath, currentFile, opts);
        },
      },
    ],
    [
      'formatjs',
      {
        removeDefaultMessage: process.env.NODE_ENV === 'production',
        idInterpolationPattern: '[sha1:contenthash:base64:6]',
      },
    ],
    [
      'react-compiler',
      {
        sources: filename => {
          return (
            !filename.endsWith('.test.tsx') && !filename.endsWith('.test.ts') && 
              // a file in react/relay that breaks the build
              !filename.includes('useUnsafeRef_DEPRECATED')
          );
        },
        enableReanimatedCheck: true,
        target: '19',
      },
    ],
    'react-native-reanimated/plugin',
  ],
};
