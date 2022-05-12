/* eslint-disable react/display-name */
import ROUTES from '@azzapp/shared/lib/routes';
import { View } from 'react-native';
import { registerScreens } from './helpers/screenRegistry';
import HomeMobileScreen, { homeScreenQuery } from './screens/HomeMobileScreen';
import SignInMobileScreen from './screens/SignInMobileScreen';
import SignUpMobileScreen from './screens/SignUpMobileScreen';
import UserMobileScreen, {
  userScreenByIdQuery,
  userScreenByNameQuery,
} from './screens/UserMobileScreen';
import type { ScreenRegistryOptions } from './helpers/screenRegistry';

const screens: ScreenRegistryOptions = {
  HOME: {
    component: HomeMobileScreen,
    query: homeScreenQuery,
  },
  USER: {
    component: UserMobileScreen,
    query: ({ userId }) =>
      userId ? userScreenByIdQuery : userScreenByNameQuery,
    getVariables: ({ userId, userName }) => ({ userId, userName }),
    options: UserMobileScreen.screenOptions,
  },
  SIGN_IN: { component: SignInMobileScreen },
  SIGN_UP: { component: SignUpMobileScreen },
  SEARCH: { component: View },
  NEW_POST: { component: View },
  CHAT: { component: View },
  PROFILE: { component: View },
  POST: { component: View },
};

export const init = () => {
  registerScreens(screens);
};

const initialTabsRoutes = [
  ROUTES.HOME,
  ROUTES.SEARCH,
  ROUTES.HOME,
  ROUTES.CHAT,
  ROUTES.PROFILE,
];

export const createInitialLayout = () => ({
  root: {
    bottomTabs: {
      children: initialTabsRoutes.map(route => ({
        stack: {
          children: [
            {
              component: {
                id: route,
                name: route,
                passProps: { route, params: {} },
              },
            },
          ],
        },
      })),
    },
  },
});
