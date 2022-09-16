import * as WebAPI from '@azzapp/shared/lib/WebAPI';
import NativeLink from '../components/NativeLink';
import fetchWithRefreshToken, { injectToken } from './fetchWithRefreshToken';
import { getTokens } from './tokensStore';
import type { NativeRouter } from '../components/NativeRouter';
import type { PlatformEnvironment } from '../PlatformEnvironment';

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
