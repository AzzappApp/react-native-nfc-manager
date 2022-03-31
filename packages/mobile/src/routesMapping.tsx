/* eslint-disable react/display-name */
import UserScreen, { userScreenQuery } from '@azzapp/app/lib/UserScreen';
import ROUTES from '@azzapp/shared/lib/routes';
import { View } from 'react-native';
import { registerScreens } from './helpers/screenRegistry';
import HomeMobileScreen, { homeScreenQuery } from './screens/HomeMobileScreen';
import SignInMobileScreen from './screens/SignInMobileScreen';
import SignUpMobileScreen from './screens/SignUpMobileScreen';
import type { ScreenRegistryOptions } from './helpers/screenRegistry';

const screens: ScreenRegistryOptions = {
  HOME: {
    component: HomeMobileScreen,
    query: homeScreenQuery,
  },
  USER: {
    component: UserScreen,
    query: userScreenQuery,
    getVariables({ userId }) {
      return { userId };
    },
    options({ params: { userId, useSharedAnimation } }) {
      if (useSharedAnimation === false) {
        return null;
      }
      return {
        animations: {
          push: {
            sharedElementTransitions: [
              {
                fromId: `cover-${userId}-image`,
                toId: `cover-${userId}-image`,
                interpolation: { type: 'spring' },
                duration: 300,
              },
              {
                fromId: `cover-${userId}-text`,
                toId: `cover-${userId}-text`,
                interpolation: { type: 'spring' },
                duration: 300,
              },
            ],
          },
          pop: {
            sharedElementTransitions: [
              {
                fromId: `cover-${userId}-image`,
                toId: `cover-${userId}-image`,
                interpolation: { type: 'spring' },
                duration: 300,
              },
              {
                fromId: `cover-${userId}-text`,
                toId: `cover-${userId}-text`,
                interpolation: { type: 'spring' },
                duration: 300,
              },
            ],
          },
        },
      };
    },
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
