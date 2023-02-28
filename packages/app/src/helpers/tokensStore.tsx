import EncryptedStorage from 'react-native-encrypted-storage';

const AUH_INFO_KEY = 'AZZAPP_AUTH';

let authInfos: { token: string; refreshToken: string } | null = null;

export const init = () =>
  EncryptedStorage.getItem(AUH_INFO_KEY)
    .then(value => {
      authInfos = value ? JSON.parse(value) : null;
    })
    .catch(() => {
      authInfos = null;
    });

export const getTokens = () => authInfos;

export const setTokens = async ({
  token,
  refreshToken,
}: {
  token: string;
  refreshToken: string;
}) => {
  authInfos = { token, refreshToken };
  await EncryptedStorage.setItem(AUH_INFO_KEY, JSON.stringify(authInfos));
  callListener();
};

export const clearTokens = async () => {
  authInfos = null;
  await EncryptedStorage.removeItem(AUH_INFO_KEY);
  callListener();
};

/*  Create a typed listener to listen when value changed in store */

type Subscription = {
  dispose: () => void;
};

type TokenListener = () => void;
const listeners: TokenListener[] = [];

const callListener = () => listeners.forEach(listener => listener());

export const addOnTokenChangedListener = (
  onTokenChanged: () => void,
): Subscription => {
  listeners.push(onTokenChanged);
  return {
    dispose: () => {
      const index = listeners.indexOf(onTokenChanged);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    },
  };
};
