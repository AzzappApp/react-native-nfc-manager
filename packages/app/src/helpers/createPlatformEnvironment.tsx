import * as WebAPI from '@azzapp/shared/WebAPI';
import NativeLink from '#components/NativeLink';
import fetchWithAuthTokens, { injectToken } from './fetchWithAuthTokens';
import { getTokens } from './tokensStore';
import type { NativeRouter } from '#components/NativeRouter';
import type { PlatformEnvironment } from '#PlatformEnvironment';

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
      WebAPI.logout(injectToken(getTokens()?.token, init as RequestInit)),
    signin: (params: WebAPI.SignInParams) =>
      WebAPI.signin({ ...params, authMethod: 'token' }),
    signup: (params: WebAPI.SignUpParams) =>
      WebAPI.signup({ ...params, authMethod: 'token' }),
    forgotPassword: (params: WebAPI.ForgotPasswordParams) =>
      WebAPI.forgotPassword({ ...params }),
    changePassword: (params: WebAPI.ChangePasswordParams) =>
      WebAPI.changePassword({ ...params }),
    refreshTokens: WebAPI.refreshTokens,
    uploadMedia: WebAPI.uploadMedia,
    uploadSign: (params, init) =>
      WebAPI.uploadSign(params, {
        ...init,
        fetchFunction: fetchWithAuthTokens,
      }),
  },
});

export default createPlatformEnvironment;
