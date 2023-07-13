/**
 * API methods used by all clients
 */
import { fromGlobalId } from 'graphql-relay';
import { fetchJSON, postFormData } from './networkHelpers';
import type { FetchFunction, fetchBlob } from './networkHelpers';

const API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT!;

type APIMethod<Params, ReturnType> = (
  params: Params,
  init: RequestInit & { fetchFunction: FetchFunction<ReturnType> },
) => Promise<ReturnType>;

type APIMethodWithOptionalInit<Params, ReturnType> = (
  params: Params,
  init?: RequestInit,
) => Promise<ReturnType>;

type APIMethodWithoutParams<ReturnType> = (
  init: RequestInit & { fetchFunction: FetchFunction<ReturnType> },
) => Promise<ReturnType>;

const apiFetch = <ReturnType>(
  input: RequestInfo,
  init: RequestInit & { fetchFunction: FetchFunction<ReturnType> },
): Promise<ReturnType> => init.fetchFunction(input, init);

export type SignUpParams = {
  password: string;
  authMethod?: 'cookie' | 'token';
} & ({ email: string } | { phoneNumber: string });

export type TokensResponse = {
  token: string;
  refreshToken: string;
};

export const signup: APIMethod<SignUpParams, TokensResponse> = (data, init) =>
  apiFetch(`${API_ENDPOINT}/signup`, {
    ...init,
    method: 'POST',
    body: JSON.stringify(data),
  });

export type SignInParams = {
  credential: string;
  password: string;
  authMethod?: 'cookie' | 'token';
};

export const signin: APIMethod<
  SignInParams,
  TokensResponse & { profileId?: string }
> = (data, init): Promise<TokensResponse> =>
  apiFetch(`${API_ENDPOINT}/signin`, {
    ...init,
    method: 'POST',
    body: JSON.stringify(data),
  });

export type CreateProfileParams = {
  userName: string;
  profileKind: string;
  profileCategoryId?: string;
  firstName?: string | null;
  lastName?: string | null;
  companyName?: string | null;
  companyActivityId?: string | null;
  authMethod?: 'cookie' | 'token';
};

export const createProfile: APIMethod<
  CreateProfileParams,
  TokensResponse & { profileId: string }
> = (data, init) =>
  apiFetch(`${API_ENDPOINT}/new-profile`, {
    ...init,
    method: 'POST',
    body: JSON.stringify(data),
  });

export type SwitchProfileParams = {
  profileId: string;
  authMethod?: 'cookie' | 'token';
};

export const switchProfile: APIMethod<
  SwitchProfileParams,
  TokensResponse & { profileId: string }
> = (data, init) =>
  apiFetch(`${API_ENDPOINT}/switch-profile`, {
    ...init,
    method: 'POST',
    body: JSON.stringify({
      ...data,
      profileId: fromGlobalId(data.profileId).id,
    }),
  });

export type ForgotPasswordParams = {
  credential: string;
};

//TODO: check if  forgotPassword method exist on server
export const forgotPassword: APIMethod<ForgotPasswordParams, TokensResponse> = (
  data,
  init,
) =>
  apiFetch(`${API_ENDPOINT}/forgotPassword`, {
    ...init,
    method: 'POST',
    body: JSON.stringify(data),
  });

export type ChangePasswordParams = {
  password: string;
  credential: string;
  token: string;
};

export const changePassword: APIMethod<ChangePasswordParams, TokensResponse> = (
  data,
  init,
) =>
  apiFetch(`${API_ENDPOINT}/changePassword`, {
    ...init,
    method: 'POST',
    body: JSON.stringify(data),
  });

export const refreshTokens: APIMethodWithOptionalInit<
  string,
  TokensResponse
> = (refreshToken, init) =>
  apiFetch(`${API_ENDPOINT}/refreshTokens`, {
    ...init,
    fetchFunction: fetchJSON as FetchFunction<TokensResponse>,
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });

export const logout: APIMethodWithoutParams<void> = async init => {
  await apiFetch(`${API_ENDPOINT}/logout`, {
    ...init,
    method: 'POST',
  });
};

export const uploadSign: APIMethod<
  { kind: 'image' | 'video'; target: 'cover' | 'post' },
  { uploadURL: string; uploadParameters: Record<string, any> }
> = async ({ kind, target }, init) =>
  apiFetch(`${API_ENDPOINT}/uploadSign`, {
    ...init,
    method: 'POST',
    body: JSON.stringify({ kind, target }),
  });

export const uploadMedia = (
  file: File,
  uploadURL: string,
  uploadParameters: Record<string, any>,
  signal?: AbortSignal,
) => {
  const formData = new FormData();
  formData.append('file', file);
  Object.keys(uploadParameters).forEach(key => {
    formData.append(key, uploadParameters[key]);
  });

  return postFormData(uploadURL, formData, 'json', signal);
};

export const verifySign: APIMethod<
  { signature: string; data: string; salt: string },
  { message: string }
> = async ({ signature, data, salt }, init) =>
  apiFetch(`${API_ENDPOINT}/verifySign`, {
    ...init,
    method: 'POST',
    body: JSON.stringify({ signature, data, salt }),
  });

export const getAppleWalletPass = (
  { locale }: { locale: string },
  init: RequestInit & { fetchFunction: typeof fetchBlob },
) =>
  apiFetch(`${API_ENDPOINT}/${locale}/wallet/apple`, {
    ...init,
    method: 'GET',
  });

export const getGoogleWalletPass: APIMethod<
  { locale: string },
  { token: string }
> = ({ locale }: { locale: string }, init) =>
  apiFetch(`${API_ENDPOINT}/${locale}/wallet/google`, {
    ...init,
    method: 'GET',
  });
