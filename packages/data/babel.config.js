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
};
