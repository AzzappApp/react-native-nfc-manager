require('#helpers/reactIntlPolyfillHelper');
import 'react-native-url-polyfill/auto';
import messaging from '@react-native-firebase/messaging';
import { AppRegistry } from 'react-native';
import { name as appName } from './app.json';
import App from './src/App';

messaging().setBackgroundMessageHandler(async () => {
  //function is here only to avoid warning
  //The handler must return a promise once your logic has completed to free up device resources.
  // It must not attempt to update any UI (e.g. via state) - you can however perform network requests, update local storage etc.
});

AppRegistry.registerComponent(appName, () => App);
