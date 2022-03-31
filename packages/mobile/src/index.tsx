/* eslint-disable react/display-name */
import ROUTES from '@azzapp/shared/lib/routes';
import { Navigation } from 'react-native-navigation';
import { init as initQueryLoader, loadQueryFor } from './helpers/QueryLoader';
import { init as initTokensStore } from './helpers/tokensStore';
import {
  createInitialLayout,
  init as initRoutesMapping,
} from './routesMapping';

const init = async () => {
  initRoutesMapping();
  await initTokensStore();
  initQueryLoader();
  loadQueryFor(ROUTES.HOME, ROUTES.HOME);
};

const initialisationPromise = init();

Navigation.events().registerAppLaunchedListener(async () => {
  await initialisationPromise;
  await Navigation.setRoot(createInitialLayout());
});
