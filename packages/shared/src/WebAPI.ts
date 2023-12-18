/**
 * This modules contains helper functions to make API calls to the backend.
 */
import { fetchJSON, postFormData } from './networkHelpers';
import type { ContactCard } from './contactCardHelpers';
import type { FetchFunction, fetchBlob } from './networkHelpers';

const API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT!;

export type APIMethod<Params, ReturnType> = (
  params: Params,
  init?: RequestInit & { fetchFunction: FetchFunction<ReturnType> },
) => Promise<ReturnType>;

/**
 * An helper function that allows injecting a custom fetch function.
 */
const apiFetch = <ReturnType>(
  input: RequestInfo,
  init?: RequestInit & { fetchFunction?: FetchFunction<ReturnType> },
): Promise<ReturnType> => {
  const fetchFunction = init?.fetchFunction ?? fetchJSON;
  return fetchFunction(input, init);
};

/**
 * Respon of API call related to authentication.
 */
export type TokensResponse = {
  token: string;
  refreshToken: string;
};

/**
 * Parameters for the signup API call.
 */
export type SignUpParams = {
  /**
   * The user's chosen password.
   */
  password: string;
} & (
  | {
      /**
       * The user's email address.
       */
      email: string;
    }
  | {
      /**
       * The user's phone number.
       */
      phoneNumber: string;
    }
);

/**
 * API call to signup a new user.
 */
export const signup: APIMethod<
  SignUpParams,
  TokensResponse & { webCardId?: string; profileRole?: string }
> = (data, init) =>
  apiFetch(`${API_ENDPOINT}/signup`, {
    ...init,
    method: 'POST',
    body: JSON.stringify(data),
  });

/**
 * Parameters for the signin API call.
 */
export type SignInParams = {
  /**
   * The user's email address or phone number.
   */
  credential: string;
  /**
   * The user's password.
   */
  password: string;
};

/**
 * API call to signin a user.
 */
export const signin: APIMethod<
  SignInParams,
  TokensResponse & { webCardId?: string; profileRole?: string }
> = (data, init): Promise<TokensResponse> =>
  apiFetch(`${API_ENDPOINT}/signin`, {
    ...init,
    method: 'POST',
    body: JSON.stringify(data),
  });

/**
 * Parameters for the forgotPassword API call.
 */
export type ForgotPasswordParams = {
  /**
   * The user's email address or phone number.
   */
  credential: string;
  /**
   * The user's locale.
   */
  locale: string;
};

/**
 * API call to request a password reset.
 */
export const forgotPassword: APIMethod<
  ForgotPasswordParams,
  { issuer: string }
> = (data, init) =>
  apiFetch(`${API_ENDPOINT}/forgotPassword`, {
    ...init,
    method: 'POST',
    body: JSON.stringify(data),
  });

/**
 * Parameters for the changePassword API call.
 */
export type ChangePasswordParams = {
  /**
   * The user's new password.
   */
  password: string;
  /**
   * The user's generated token from the forgotPassword API call.
   */
  token: string;
  /**
   * The user's email address or phone number used to retrieve the token.
   */
  issuer: string;
};

/**
 * API call to change a user's password after a password reset.
 */
export const changePassword: APIMethod<ChangePasswordParams, TokensResponse> = (
  data,
  init,
) =>
  apiFetch(`${API_ENDPOINT}/changePassword`, {
    ...init,
    method: 'POST',
    body: JSON.stringify(data),
  });

/**
 * Refresh the user's tokens.
 * @param refreshToken The user's refresh token.
 * @param init Optional init object to inject a custom fetch function.
 * @returns A promise that resolves to the new tokens.
 */
export const refreshTokens: APIMethod<string, TokensResponse> = (
  refreshToken,
  init,
) =>
  apiFetch(`${API_ENDPOINT}/refreshTokens`, {
    ...init,
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });

/**
 * Api call to get a signed URL to upload a file to cloud storage.
 */
export const uploadSign: APIMethod<
  {
    kind: 'image' | 'video';
    target: 'cover' | 'coverSource' | 'module' | 'post';
  },
  { uploadURL: string; uploadParameters: Record<string, any> }
> = async ({ kind, target }, init) =>
  apiFetch(`${API_ENDPOINT}/uploadSign`, {
    ...init,
    method: 'POST',
    body: JSON.stringify({ kind, target }),
  });

/**
 * Api call to upload a file to cloud storage.
 * @param file The file to upload.
 * @param uploadURL The signed URL to upload the file to.
 * @param uploadParameters the signed parameters to upload the file.
 * @param signal An optional AbortSignal to abort the upload.
 * @returns an object containing :
 *  - A promise that resolves to the upload response. (currently a cloudinary response)
 *  - An observable that emits the upload progress.
 */
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

/**
 * Api call to check the signature of a contact card.
 */
export const verifySign: APIMethod<
  { signature: string; data: string; salt: string },
  Pick<ContactCard, 'socials' | 'urls'>
> = async ({ signature, data, salt }, init) =>
  apiFetch(`${API_ENDPOINT}/verifySign`, {
    ...init,
    method: 'POST',
    body: JSON.stringify({ signature, data, salt }),
  });

/**
 * Api call to generate an apple wallet pass.
 */
export const getAppleWalletPass = (
  { locale, webCardId }: { locale: string; webCardId: string },
  init: RequestInit & { fetchFunction: typeof fetchBlob },
) =>
  apiFetch(`${API_ENDPOINT}/${locale}/wallet/apple?webCardId=${webCardId}`, {
    ...init,
    method: 'GET',
  });

/**
 * Api call to generate a google wallet pass.
 */
export const getGoogleWalletPass: APIMethod<
  { locale: string; webCardId: string },
  { token: string }
> = ({ locale, webCardId }, init) =>
  apiFetch(`${API_ENDPOINT}/${locale}/wallet/google?webCardId=${webCardId}`, {
    ...init,
    method: 'GET',
  });
