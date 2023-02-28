const baseConfig = require('./babel.config.base.js');

module.exports = {
  presets: [
    [
      'module:metro-react-native-babel-preset',
      {
        unstable_transformProfile: 'hermes-stable',
      },
    ],
  ],
  plugins: [...baseConfig.getPlugins(true), 'react-native-reanimated/plugin'],
};
