/**
 * API methods used by all clients
 */
import { fetchJSON, postFormData } from './networkHelpers';

const API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT!;

type FetchFunction = (input: RequestInfo, init: RequestInit) => Promise<any>;

type APIMethod<Params, ReturnType> = (
  params: Params,
  init?: RequestInit & { fetchFunction?: typeof fetchJSON },
) => Promise<ReturnType>;

type APIMethodWithoutParams<ReturnType> = (
  init?: RequestInit & { fetchFunction?: typeof fetchJSON },
) => Promise<ReturnType>;

const apiFetch = (
  input: RequestInfo,
  init: RequestInit & { fetchFunction?: FetchFunction },
) => (init.fetchFunction ?? fetchJSON)(input, init);

export type SignUpParams = {
  userName: string;
  email?: string;
  phoneNumber?: string;
  password: string;
  firstName?: string;
  lastName?: string;
  authMethod?: 'cookie' | 'token';
};

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

export const signin: APIMethod<SignInParams, TokensResponse> = (
  data,
  init,
): Promise<TokensResponse> =>
  apiFetch(`${API_ENDPOINT}/signin`, {
    ...init,
    method: 'POST',
    body: JSON.stringify(data),
  });

export type ForgotPasswordParams = {
  credential: string;
};

//TODO: check if  forgotPassword method exist on server
export const forgotPassword: APIMethod<ForgotPasswordParams, TokensResponse> = (
  data,
  init,
): Promise<TokensResponse> =>
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
): Promise<TokensResponse> =>
  apiFetch(`${API_ENDPOINT}/changePassword`, {
    ...init,
    method: 'POST',
    body: JSON.stringify(data),
  });

export const refreshTokens: APIMethod<string, TokensResponse> = (
  refreshToken,
  init,
): Promise<TokensResponse> =>
  apiFetch(`${API_ENDPOINT}/refreshTokens`, {
    ...init,
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });

export const logout: APIMethodWithoutParams<void> = (init): Promise<void> =>
  apiFetch(`${API_ENDPOINT}/logout`, {
    ...init,
    method: 'POST',
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
