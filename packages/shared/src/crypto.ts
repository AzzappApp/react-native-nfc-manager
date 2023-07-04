import * as Iron from 'iron-webcrypto';
import type { SealOptions, RawPassword } from 'iron-webcrypto';

export const getCrypto = (): Crypto => {
  if (process.env.NEXT_RUNTIME !== 'edge') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('node:crypto').webcrypto;
  }
  if (typeof globalThis.crypto?.subtle === 'object') {
    return globalThis.crypto;
  }
  // @ts-expect-error crypto.webcrypto is not available in dom, but is there in newer node versions
  if (typeof globalThis.crypto?.webcrypto?.subtle === 'object')
    // @ts-expect-error same as above
    return globalThis.crypto.webcrypto;
  throw new Error(
    'no native implementation of WebCrypto is available in current context',
  );
};
export const seal = (
  data: unknown,
  password: RawPassword,
  options?: Partial<SealOptions>,
) =>
  Iron.seal(getCrypto(), data, password, {
    ...Iron.defaults,
    ...options,
  });

export const unseal = async (
  seal: string,
  password: Iron.Password | Iron.password.Hash,
  options?: Partial<SealOptions>,
) => {
  const sealed = await Iron.unseal(getCrypto(), seal, password, {
    ...Iron.defaults,
    ...options,
  });
  return sealed;
};

const DEFAULT_HMAC_OPTIONS = {
  iterations: 1,
  minPasswordlength: 8,
  algorithm: 'sha256',
} as const;

export const hmacWithPassword = async (
  password: Iron.Password,
  data: string,
  options?: Partial<Iron.GenerateKeyOptions>,
): Promise<Iron.HMacResult> => {
  const key = await Iron.generateKey(getCrypto(), password, {
    ...DEFAULT_HMAC_OPTIONS,
    ...options,
    hmac: true,
  });
  const textBuffer = Iron.stringToBuffer(data);
  const signed = await getCrypto().subtle.sign('hmac', key.key, textBuffer);

  const digest = Iron.base64urlEncode(new Uint8Array(signed));

  return { digest, salt: key.salt };
};

export const verifyHmacWithPassword = async (
  password: Iron.Password,
  signature: string,
  data: string,
  options?: Partial<Iron.GenerateKeyOptions>,
): Promise<boolean> => {
  const key = await Iron.generateKey(getCrypto(), password, {
    ...DEFAULT_HMAC_OPTIONS,
    ...options,
    hmac: true,
  });

  const textBuffer = Iron.stringToBuffer(data);
  const signatureBuffer = Iron.base64urlDecode(signature);
  const verified = await getCrypto().subtle.verify(
    'hmac',
    key.key,
    signatureBuffer,
    textBuffer,
  );

  return verified;
};
