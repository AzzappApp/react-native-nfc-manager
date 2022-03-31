module.exports = {
  presets: [
    [
      'module:metro-react-native-babel-preset',
      {
        useTransformReactJSXExperimental: true,
        unstable_transformProfile: 'hermes-stable',
      },
    ],
  ],
  plugins: [
    ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }],
    // TODO allowList to avoid bad env injected ?
    ['module:react-native-dotenv', { moduleName: 'process.env' }],
    'relay',
  ],
};
