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
