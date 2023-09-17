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
  ignore: ['**/__mocks__/*', '**/__tests__/*'],
};
