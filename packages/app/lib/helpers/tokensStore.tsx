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
};

export const clearTokens = async () => {
  authInfos = null;
  await EncryptedStorage.removeItem(AUH_INFO_KEY);
};
