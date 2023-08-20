/**
 * API methods used by all clients
 */
import { fetchJSON, postFormData } from './networkHelpers';
import type { FetchFunction, fetchBlob } from './networkHelpers';

const API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT!;

export type APIMethod<Params, ReturnType> = (
  params: Params,
  init?: RequestInit & { fetchFunction: FetchFunction<ReturnType> },
) => Promise<ReturnType>;

const apiFetch = <ReturnType>(
  input: RequestInfo,
  init?: RequestInit & { fetchFunction?: FetchFunction<ReturnType> },
): Promise<ReturnType> => {
  const fetchFunction = init?.fetchFunction ?? fetchJSON;
  return fetchFunction(input, init);
};

export type SignUpParams = {
  password: string;
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

export type ForgotPasswordParams = {
  credential: string;
  locale: string;
};

export const forgotPassword: APIMethod<
  ForgotPasswordParams,
  { issuer: string }
> = (data, init) =>
  apiFetch(`${API_ENDPOINT}/forgotPassword`, {
    ...init,
    method: 'POST',
    body: JSON.stringify(data),
  });

export type ChangePasswordParams = {
  password: string;
  token: string;
  issuer: string;
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

export const refreshTokens: APIMethod<string, TokensResponse> = (
  refreshToken,
  init,
) =>
  apiFetch(`${API_ENDPOINT}/refreshTokens`, {
    ...init,
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });

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
  { locale, profileId }: { locale: string; profileId: string },
  init: RequestInit & { fetchFunction: typeof fetchBlob },
) =>
  apiFetch(`${API_ENDPOINT}/${locale}/wallet/apple?profileId=${profileId}`, {
    ...init,
    method: 'GET',
  });

export const getGoogleWalletPass: APIMethod<
  { locale: string; profileId: string },
  { token: string }
> = ({ locale, profileId }, init) =>
  apiFetch(`${API_ENDPOINT}/${locale}/wallet/google?profileId=${profileId}`, {
    ...init,
    method: 'GET',
  });
