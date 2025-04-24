import * as Iron from 'iron-webcrypto';
import type { SealOptions, RawPassword } from 'iron-webcrypto';

/**
 * Returns the native crypto implementation for the current context.
 * In node, this is the native crypto module, in the browser it is the
 * crypto implementation provided by the browser.
 * In edge, this is the webcrypto implementation provided by the edge runtime.
 *
 * @returns {Crypto} - the native crypto implementation
 */
export const getCrypto = (): Crypto => {
  if (process.env.NEXT_RUNTIME !== 'edge') {
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

/**
 * Seal data with a password
 * @param data - data to seal
 * @param password - password to seal data with
 * @param options - options for sealing @see SealOptions
 * @returns sealed string
 */
export const seal = (
  data: unknown,
  password: RawPassword,
  options?: Partial<SealOptions>,
) =>
  Iron.seal(getCrypto(), data, password, {
    ...Iron.defaults,
    ...options,
  });

/**
 * Unseal data with a password
 * @param seal - sealed string
 * @param password - password to unseal data with
 * @param options - options for unsealing @see SealOptions
 * @returns unsealed data
 */
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

/**
 * Calculates a HMAC digest.
 * @param password  A password string or buffer
 * @param data String to calculate the HMAC over
 * @param options Object used to customize the key derivation algorithm @see Iron.GenerateKeyOptions
 * @returns An object with keys: digest, salt
 */
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

/**
 * Verifies a HMAC digest.
 * @param password  A password string or buffer
 * @param signature HMAC signature to verify
 * @param data String to calculate the HMAC over
 * @param options Object used to customize the key derivation algorithm @see Iron.GenerateKeyOptions
 * @returns true if the signature is valid, false otherwise
 */
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

export const sha256 = async (message: string) => {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await getCrypto().subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const importPublicKey = async (base64Key: string) => {
  const rawKey = Buffer.from(base64Key, 'base64');

  return getCrypto().subtle.importKey(
    'raw',
    rawKey,
    {
      name: 'Ed25519',
      namedCurve: 'Ed25519',
    },
    true,
    ['verify'],
  );
};

export const verifyMessage = async (
  publicKey: CryptoKey,
  message: string,
  signatureBase64: string,
) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const signature = Buffer.from(signatureBase64, 'base64');

  return getCrypto().subtle.verify(
    {
      name: 'Ed25519',
    },
    publicKey,
    signature,
    data,
  );
};
