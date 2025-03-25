import { fetchBlob, fetchJSON } from '@azzapp/shared/networkHelpers';
import * as WebAPI from '@azzapp/shared/WebAPI';
import fetchWithAuthTokens from './fetchWithAuthTokens';
import fetchWithGlobalEvents from './fetchWithGlobalEvents';
import type { FetchFunction } from '@azzapp/shared/networkHelpers';

const authenticatedFetchJSON = fetchWithGlobalEvents(
  fetchWithAuthTokens(fetchJSON),
);
const authenticatedFetchBlob = fetchWithGlobalEvents(
  fetchWithAuthTokens(fetchBlob),
);
const unauthenticatedFetchJSON = fetchWithGlobalEvents(fetchJSON);

const withFetchFunction = <TMethod extends WebAPI.APIMethod<any, any>>(
  fn: TMethod,
  fetchFunction: FetchFunction<any>,
): TMethod =>
  ((params: any, init: any) => fn(params, { ...init, fetchFunction })) as any;

export const signin = withFetchFunction(
  WebAPI.signin,
  unauthenticatedFetchJSON,
);

export const signup = withFetchFunction(
  WebAPI.signup,
  unauthenticatedFetchJSON,
);

export const appleSignin = withFetchFunction(
  WebAPI.appleSignin,
  unauthenticatedFetchJSON,
);

export const confirmRegistration = withFetchFunction(
  WebAPI.confirmRegistration,
  authenticatedFetchJSON,
);

export const forgotPassword = withFetchFunction(
  WebAPI.forgotPassword,
  unauthenticatedFetchJSON,
);

export const changePassword = withFetchFunction(
  WebAPI.changePassword,
  authenticatedFetchJSON,
);

export const refreshTokens = WebAPI.refreshTokens;

export const uploadMedia: typeof WebAPI.uploadMedia = WebAPI.uploadMedia;

export const uploadSign = withFetchFunction(
  WebAPI.uploadSign,
  authenticatedFetchJSON,
);

export const verifySign = withFetchFunction(
  WebAPI.verifySign,
  unauthenticatedFetchJSON,
);

type appleWalletPassParams = { locale: string; webCardId: string };

export const getAppleWalletPass = (params: appleWalletPassParams) =>
  WebAPI.getAppleWalletPass(params, {
    fetchFunction: authenticatedFetchBlob,
  });

export const getGoogleWalletPass = withFetchFunction(
  WebAPI.getGoogleWalletPass,
  authenticatedFetchJSON,
);

export const requestUpdateContact = withFetchFunction(
  WebAPI.requestUpdateContact,
  authenticatedFetchJSON,
);
