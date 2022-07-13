import * as WebAPI from '@azzapp/shared/lib/WebAPI';
import Link from '../components/Link';
import fetchWithRefreshToken, { injectToken } from './fetchWithRefreshToken';
import { getTokens } from './tokensStore';
import type { NativeRouter } from '../components/NativeRouter';
import type { PlatformEnvironment } from '@azzapp/app/lib/PlatformEnvironment';

const createPlatformEnvironment = (
  router: NativeRouter,
): PlatformEnvironment => ({
  router,
  LinkComponent: Link,
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
