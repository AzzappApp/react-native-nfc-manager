import { fetchJSON } from '@azzapp/shared/networkHelpers';
import * as WebAPI from '@azzapp/shared/WebAPI';
import { getTokens } from './authStore';
import fetchWithAuthTokens, { injectToken } from './fetchWithAuthTokens';
import fetchWithGlobalEvents from './fetchWithGlobalEvents';
import { dispatchGlobalEvent } from './globalEvents';

const authenticatedFetch = fetchWithGlobalEvents(fetchWithAuthTokens);
const unauthenticatedFetch = fetchWithGlobalEvents(fetchJSON);

type Logout = typeof WebAPI.logout;
export const logout: Logout = init => {
  const res = WebAPI.logout(
    injectToken(getTokens()?.token, {
      ...init,
      fetchFunction: unauthenticatedFetch,
    } as RequestInit),
  );
  void dispatchGlobalEvent({ type: 'SIGN_OUT' });
  return res;
};

type Signin = typeof WebAPI.signin;
export const signin: Signin = params =>
  WebAPI.signin(
    { ...params, authMethod: 'token' },
    { fetchFunction: unauthenticatedFetch },
  );

export const signup: typeof WebAPI.signup = params =>
  WebAPI.signup(
    { ...params, authMethod: 'token' },
    { fetchFunction: unauthenticatedFetch },
  );

export const createProfile: typeof WebAPI.createProfile = (
  params: WebAPI.CreateProfileParams,
  init,
) =>
  WebAPI.createProfile(
    { ...params, authMethod: 'token' },
    {
      ...init,
      fetchFunction: authenticatedFetch,
    },
  );

export const switchProfile: typeof WebAPI.switchProfile = (
  params: WebAPI.SwitchProfileParams,
  init,
) =>
  WebAPI.switchProfile(
    { ...params, authMethod: 'token' },
    { ...init, fetchFunction: authenticatedFetch },
  );

export const forgotPassword: typeof WebAPI.forgotPassword = (
  params: WebAPI.ForgotPasswordParams,
) =>
  WebAPI.forgotPassword({ ...params }, { fetchFunction: unauthenticatedFetch });

export const changePassword: typeof WebAPI.changePassword = (
  params: WebAPI.ChangePasswordParams,
) =>
  WebAPI.changePassword({ ...params }, { fetchFunction: authenticatedFetch });

export const refreshTokens: typeof WebAPI.refreshTokens = (params, init) =>
  WebAPI.refreshTokens(params, {
    ...init,
    fetchFunction: unauthenticatedFetch,
  });

export const uploadMedia: typeof WebAPI.uploadMedia = WebAPI.uploadMedia;

export const uploadSign: typeof WebAPI.uploadSign = (params, init) =>
  WebAPI.uploadSign(params, {
    ...init,
    fetchFunction: authenticatedFetch,
  });

export const verifySign: typeof WebAPI.verifySign = (params, init) =>
  WebAPI.verifySign(params, {
    ...init,
    fetchFunction: unauthenticatedFetch,
  });
