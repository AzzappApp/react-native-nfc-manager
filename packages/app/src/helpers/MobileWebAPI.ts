import { fetchBlob, fetchJSON } from '@azzapp/shared/networkHelpers';
import * as WebAPI from '@azzapp/shared/WebAPI';
import { getTokens } from './authStore';
import fetchWithAuthTokens, { injectToken } from './fetchWithAuthTokens';
import fetchWithGlobalEvents from './fetchWithGlobalEvents';
import { dispatchGlobalEvent } from './globalEvents';

const authenticatedFetchJSON = fetchWithGlobalEvents(
  fetchWithAuthTokens(fetchJSON),
);
const authenticatedFetchBlob = fetchWithGlobalEvents(
  fetchWithAuthTokens(fetchBlob),
);
const unauthenticatedFetchJSON = fetchWithGlobalEvents(fetchJSON);

type ApiMethod<P extends (...args: any) => any> = (
  params: Parameters<P>[0],
  init?: Parameters<P>[1],
) => ReturnType<P>;

type ApiMethodWithoutParams<P extends (...args: any) => any> = (
  init?: Parameters<P>[0],
) => ReturnType<P>;

type Logout = typeof WebAPI.logout;
export const logout: ApiMethodWithoutParams<Logout> = init => {
  const res = WebAPI.logout({
    ...injectToken(getTokens()?.token, {
      ...init,
    }),
    fetchFunction: init?.fetchFunction ?? fetchJSON,
  });
  void dispatchGlobalEvent({ type: 'SIGN_OUT' });
  return res;
};

type Signin = typeof WebAPI.signin;

export const signin: ApiMethod<Signin> = params =>
  WebAPI.signin(
    { ...params, authMethod: 'token' },
    { fetchFunction: unauthenticatedFetchJSON },
  );

export const signup: ApiMethod<typeof WebAPI.signup> = params =>
  WebAPI.signup(
    { ...params, authMethod: 'token' },
    { fetchFunction: unauthenticatedFetchJSON },
  );

export const createProfile: ApiMethod<typeof WebAPI.createProfile> = (
  params,
  init,
) =>
  WebAPI.createProfile(
    { ...params, authMethod: 'token' },
    {
      ...init,
      fetchFunction: authenticatedFetchJSON,
    },
  );

export const switchProfile: ApiMethod<typeof WebAPI.switchProfile> = (
  params: WebAPI.SwitchProfileParams,
  init,
) =>
  WebAPI.switchProfile(
    { ...params, authMethod: 'token' },
    { ...init, fetchFunction: authenticatedFetchJSON },
  );

export const forgotPassword: ApiMethod<typeof WebAPI.forgotPassword> = (
  params: WebAPI.ForgotPasswordParams,
) =>
  WebAPI.forgotPassword(
    { ...params },
    { fetchFunction: unauthenticatedFetchJSON },
  );

export const changePassword: ApiMethod<typeof WebAPI.changePassword> = (
  params: WebAPI.ChangePasswordParams,
) =>
  WebAPI.changePassword(
    { ...params },
    { fetchFunction: authenticatedFetchJSON },
  );

export const refreshTokens: ApiMethod<typeof WebAPI.refreshTokens> = (
  params,
  init,
) =>
  WebAPI.refreshTokens(params, {
    ...init,
  });

export const uploadMedia: typeof WebAPI.uploadMedia = WebAPI.uploadMedia;

export const uploadSign: ApiMethod<typeof WebAPI.uploadSign> = (params, init) =>
  WebAPI.uploadSign(params, {
    ...init,
    fetchFunction: authenticatedFetchJSON,
  });

export const verifySign: ApiMethod<typeof WebAPI.verifySign> = (
  params: Parameters<typeof WebAPI.verifySign>[0],
  init,
) =>
  WebAPI.verifySign(params, {
    ...init,
    fetchFunction: unauthenticatedFetchJSON,
  });

export const getAppleWalletPass: ApiMethod<typeof WebAPI.getAppleWalletPass> = (
  params,
  init,
) =>
  WebAPI.getAppleWalletPass(params, {
    ...init,
    fetchFunction: authenticatedFetchBlob,
  });

export const getGoogleWalletPass: ApiMethod<
  typeof WebAPI.getGoogleWalletPass
> = (params, init) =>
  WebAPI.getGoogleWalletPass(params, {
    ...init,
    fetchFunction: authenticatedFetchJSON,
  });
