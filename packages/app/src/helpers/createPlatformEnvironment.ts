import { fetchJSON } from '@azzapp/shared/networkHelpers';
import * as WebAPI from '@azzapp/shared/WebAPI';
import NativeLink from '#components/NativeLink';
import { getTokens } from './authStore';
import fetchWithAuthTokens, { injectToken } from './fetchWithAuthTokens';
import fetchWithGlobalEvents from './fetchWithGlobalEvents';
import type { NativeRouter } from '#components/NativeRouter';
import type { PlatformEnvironment } from '#PlatformEnvironment';

const authenticatedFetch = fetchWithGlobalEvents(fetchWithAuthTokens);
const unauthenticatedFetch = fetchWithGlobalEvents(fetchJSON);

/**
 * Creates a platform environment for the native app.
 *
 * @param router The router to use
 * @returns The platform environment
 */
const createPlatformEnvironment = (
  router: NativeRouter,
): PlatformEnvironment => ({
  router,
  LinkComponent: NativeLink,
  WebAPI: {
    logout: init =>
      WebAPI.logout(
        injectToken(getTokens()?.token, {
          ...init,
          fetchFunction: unauthenticatedFetch,
        } as RequestInit),
      ),
    signin: params =>
      WebAPI.signin(
        { ...params, authMethod: 'token' },
        { fetchFunction: unauthenticatedFetch },
      ),
    signup: params =>
      WebAPI.signup(
        { ...params, authMethod: 'token' },
        { fetchFunction: unauthenticatedFetch },
      ),
    createProfile: (params: WebAPI.CreateProfileParams, init) =>
      WebAPI.createProfile(
        { ...params, authMethod: 'token' },
        {
          ...init,
          fetchFunction: authenticatedFetch,
        },
      ),
    switchProfile: (params: WebAPI.SwitchProfileParams, init) =>
      WebAPI.switchProfile(
        { ...params, authMethod: 'token' },
        { ...init, fetchFunction: authenticatedFetch },
      ),
    forgotPassword: (params: WebAPI.ForgotPasswordParams) =>
      WebAPI.forgotPassword(
        { ...params },
        { fetchFunction: unauthenticatedFetch },
      ),
    changePassword: (params: WebAPI.ChangePasswordParams) =>
      WebAPI.changePassword(
        { ...params },
        { fetchFunction: authenticatedFetch },
      ),
    refreshTokens: (params, init) =>
      WebAPI.refreshTokens(params, {
        ...init,
        fetchFunction: unauthenticatedFetch,
      }),
    uploadMedia: WebAPI.uploadMedia,
    uploadSign: (params, init) =>
      WebAPI.uploadSign(params, {
        ...init,
        fetchFunction: authenticatedFetch,
      }),
  },
});

export default createPlatformEnvironment;
