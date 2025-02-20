module.exports = {
  presets: ['@babel/preset-typescript'],
  plugins: [
    [
      'module-resolver',
      {
        alias: {
          '^#(.+)': './src/\\1',
        },
      },
    ],
  ],
  ignore: ['**/__mocks__/*'],
  env: {
    test: {
      plugins: ['@babel/plugin-transform-modules-commonjs'],
    },
  },
};
