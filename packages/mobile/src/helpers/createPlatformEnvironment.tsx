import ROUTES from '@azzapp/shared/lib/routes';
import * as WebAPI from '@azzapp/shared/lib/WebAPI';
import { Platform } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { Navigation } from 'react-native-navigation';
import Link from '../components/Link';
import fetchWithRefreshToken, { injectToken } from './fetchWithRefreshToken';
import { getTokens } from './tokensStore';
import type { PlatformEnvironment } from '@azzapp/app/lib/PlatformEnvironment';
import type { Routes } from '@azzapp/shared/lib/routes';

let currentRoute: { route: Routes; params: any } = {
  route: ROUTES.HOME,
  params: null,
};

Navigation.events().registerComponentWillAppearListener(({ passProps }) => {
  currentRoute = {
    route: (passProps as any).route as Routes,
    params: (passProps as any).params,
  };
});

const createPlatformEnvironment = (
  componentId: string,
): PlatformEnvironment => ({
  router: {
    push(route, params, options) {
      void Navigation.push(componentId, {
        component: { name: route, passProps: { params, route }, options },
      });
    },
    replace(route, params, options) {
      // TODO should this works ?
      console.error('replace does not works on native app');
      this.push(route, params, options);
    },
    showModal(route, params, options) {
      void Navigation.showModal({
        stack: {
          children: [
            {
              component: { name: route, passProps: { params, route }, options },
            },
          ],
        },
      });
    },
    back(options) {
      void Navigation.pop(componentId, options);
    },
    getCurrenRoute() {
      return currentRoute;
    },
    addRouteWillChangeListener(callback) {
      const subscription =
        Navigation.events().registerComponentWillAppearListener(
          ({ passProps }) => {
            const route = (passProps as any).route as Routes;
            const params = (passProps as any).params as Routes;
            callback(route, params);
          },
        );

      return {
        dispose() {
          subscription.remove();
        },
      };
    },
    addRouteDidChangeListener(callback) {
      const subscription =
        Navigation.events().registerComponentDidAppearListener(
          ({ passProps }) => {
            const route = (passProps as any).route as Routes;
            const params = (passProps as any).params as Routes;
            callback(route, params);
          },
        );

      return {
        dispose() {
          subscription.remove();
        },
      };
    },
  },
  LinkComponent: Link,
  async launchImagePicker() {
    const { didCancel, errorCode, assets } = await launchImageLibrary({
      quality: 0.5,
      mediaType: 'mixed',
    });
    const photo = assets?.[0];
    return {
      didCancel,
      error: errorCode ? new Error(errorCode) : undefined,
      uri: photo?.uri,
      file:
        photo &&
        ({
          name: photo.fileName,
          type: photo.type,
          uri:
            Platform.OS === 'ios'
              ? photo.uri?.replace('file://', '')
              : photo.uri,
        } as any),
    };
  },
  WebAPI: {
    logout: (_, init) =>
      WebAPI.logout(_, injectToken(getTokens()?.token, init as RequestInit)),
    signin: (params: WebAPI.SignInParams) =>
      WebAPI.signin({ ...params, authMethod: 'token' }),
    signup: (params: WebAPI.SignUpParams) =>
      WebAPI.signup({ ...params, authMethod: 'token' }),
    refreshTokens: WebAPI.refreshTokens,
    uploadMedia: WebAPI.uploadMedia,
    uploadSign: (params, init) =>
      WebAPI.uploadSign(params, {
        ...init,
        fetchFunction: fetchWithRefreshToken,
      }),
  },
});

export default createPlatformEnvironment;
