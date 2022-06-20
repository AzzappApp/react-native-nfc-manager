import { fetchJSON, postFormData } from './networkHelpers';

const API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT!;
const CLOUDINARY_CLOUDNAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const CLOUDINARY_API_KEY = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY!;
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUDNAME}/upload`;

type FetchFunction = (input: RequestInfo, init: RequestInit) => Promise<any>;

type APIMethod<Params, ReturnType> = Params extends undefined
  ? <
      FetchFunc extends FetchFunction = typeof fetchJSON,
      ReqInit = Parameters<FetchFunc>[1],
    >(
      params?: undefined,
      init?: ReqInit & { fetchFunction?: FetchFunc },
    ) => Promise<ReturnType>
  : <
      FetchFunc extends FetchFunction = typeof fetchJSON,
      ReqInit = Parameters<FetchFunc>[1],
    >(
      params: Params,
      init?: ReqInit & { fetchFunction?: FetchFunc },
    ) => Promise<ReturnType>;

const apiFetch = (
  input: RequestInfo,
  init: RequestInit & { fetchFunction?: FetchFunction },
) => (init.fetchFunction ?? fetchJSON)(input, init);

export type SignUpParams = {
  userName: string;
  email: string;
  password: string;
  // locale?: string;
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
  userNameOrEmail: string;
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

export const refreshTokens: APIMethod<string, TokensResponse> = (
  refreshToken,
  init,
): Promise<TokensResponse> =>
  apiFetch(`${API_ENDPOINT}/refreshTokens`, {
    ...init,
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });

export const logout: APIMethod<undefined, void> = (_, init): Promise<void> =>
  apiFetch(`${API_ENDPOINT}/logout`, {
    ...init,
    method: 'POST',
  });

export const uploadSign: APIMethod<
  { kind: 'picture' | 'video'; target: 'cover' | 'post' },
  Record<string, string>
> = async ({ kind, target }, init) =>
  apiFetch(`${API_ENDPOINT}/uploadSign`, {
    ...init,
    method: 'POST',
    body: JSON.stringify({ kind, target }),
  });

export const uploadMedia = (
  file: File,
  uploadSettings: Record<string, string>,
  signal?: AbortSignal,
) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', CLOUDINARY_API_KEY);
  // eslint-disable-next-line guard-for-in
  for (const key in uploadSettings) {
    formData.append(key, uploadSettings[key]);
  }

  return postFormData(CLOUDINARY_URL, formData, 'json', signal);
};
