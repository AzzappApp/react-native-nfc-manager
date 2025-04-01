import type { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'azzapp',
  owner: 'azzapp',
  slug: 'azzapp',
  runtimeVersion: '1.0.0',
  scheme: process.env.APP_SCHEME ?? 'azzapp',
  extra: {
    eas: {
      projectId: '6f4f8646-b45c-4cc0-85ae-a5aa04a7bebb',
    },
  },
  ios: {
    bundleIdentifier: 'com.azzapp.app',
  },
  plugins: [
    [
      '@sentry/react-native/expo',
      {
        url: 'https://sentry.io/',
        project: 'azzapp-app',
        organization: 'azzapp',
      },
    ],
    [
      'expo-quick-actions',
      {
        androidIcons: {
          shortcut_scan: {
            foregroundImage: './src/ui/Icon/assets/scan.png',
            backgroundColor: '#45444C',
          },
        },
      },
    ],
    [
      'react-native-vision-camera',
      {
        enableCodeScanner: true,
      },
    ],
  ],
});
