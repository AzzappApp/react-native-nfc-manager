const { createTransformer } = require('babel-jest');

module.exports = createTransformer({
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }],
    ['relay', { eagerEsModules: false }],
  ],
});
