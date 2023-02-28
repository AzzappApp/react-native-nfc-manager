const baseConfig = require('./babel.config.base.js');

module.exports = {
  presets: ['@babel/preset-typescript'],
  plugins: baseConfig.getPlugins(false),
};
