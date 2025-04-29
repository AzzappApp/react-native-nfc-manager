import Crypto from 'react-native-quick-crypto';

export const createHash = (string: string) => {
  const hash = Crypto.createHash('md5');
  hash.update(string);
  return hash
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};
