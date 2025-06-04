import * as ed from '@noble/ed25519';
import * as Sentry from '@sentry/react-native';
import { fromGlobalId } from 'graphql-relay';
import { useEffect, useMemo, useRef } from 'react';
import { useIntl } from 'react-intl';
import { MMKV, useMMKVString } from 'react-native-mmkv';
import { fromByteArray } from 'react-native-quick-base64';
import Crypto from 'react-native-quick-crypto';
import Toast from 'react-native-toast-message';
import { commitMutation, graphql, readInlineData } from 'react-relay';
import { getRelayEnvironment } from '#helpers/relayEnvironment';
import type { useQRCodeKey_profile$key } from '#relayArtifacts/useQRCodeKey_profile.graphql';

const encryptedQrCodeStorage = new MMKV({
  id: `encrypted-qrcode-storage`,
  encryptionKey: '@azzapp-qrcode-encryption-key',
});

export const getQRCodeDeviceId = () => {
  let deviceId = encryptedQrCodeStorage.getString('deviceId');

  if (!deviceId) {
    deviceId = Crypto.randomUUID();
    encryptedQrCodeStorage.set('deviceId', deviceId);
  }
  return deviceId;
};

const deviceId = getQRCodeDeviceId();

const PUBLIC_KEY_STORAGE_KEY = 'publicKeyForProfile';

const readProfileData = (
  profileKey: useQRCodeKey_profile$key | null | undefined,
) =>
  readInlineData(
    graphql`
      fragment useQRCodeKey_profile on Profile
      @inline
      @argumentDefinitions(
        deviceId: { type: "String!", provider: "qrCodeDeviceId.relayprovider" }
      ) {
        id
        contactCardAccessId(deviceId: $deviceId)
      }
    `,
    profileKey,
  );

const generateQRCodeKey = async (profileId: string): Promise<string> => {
  const message = new TextEncoder().encode(fromGlobalId(profileId).id);
  const privateKey = ed.utils.randomPrivateKey();

  const publicKey = await ed.getPublicKeyAsync(privateKey);
  const signature = await ed.signAsync(message, privateKey);

  return new Promise((resolve, reject) => {
    commitMutation(getRelayEnvironment(), {
      mutation: graphql`
        mutation useQRCodeKeyStoreMutation(
          $input: SaveContactCardAccessInput!
          $deviceId: String!
        ) {
          saveContactCardAccess(input: $input) {
            profile {
              id
              contactCardAccessId(deviceId: $deviceId)
            }
          }
        }
      `,
      variables: {
        input: {
          deviceId,
          profileId,
          signature: fromByteArray(signature),
        },
        deviceId,
      },
      onError: error => {
        reject(error);
      },
      onCompleted: () => {
        resolve(fromByteArray(publicKey));
      },
    });
  });
};

const useQRCodeKey = (profileKey?: useQRCodeKey_profile$key | null) => {
  const data = useMemo(() => readProfileData(profileKey), [profileKey]);
  const { contactCardAccessId, id } = data || {};

  const [publicKey, setPublicKey] = useMMKVString(
    `${PUBLIC_KEY_STORAGE_KEY}:${id}`,
    encryptedQrCodeStorage,
  );

  const buildingKeyPair = useRef(false);

  const intl = useIntl();

  useEffect(() => {
    if (
      id &&
      (!contactCardAccessId || !publicKey) &&
      !buildingKeyPair.current
    ) {
      buildingKeyPair.current = true;

      (async () => {
        generateQRCodeKey(id).then(
          key => {
            setPublicKey(key);
            buildingKeyPair.current = false;
          },
          error => {
            Sentry.captureException(error);
            buildingKeyPair.current = false;
            Toast.show({
              type: 'error',
              text1: intl.formatMessage({
                defaultMessage:
                  'The QR code can not be generated, please try again',
                description:
                  'Error message when the QR code can not be generated',
              }),
            });
          },
        );
      })();
    }
  }, [contactCardAccessId, id, setPublicKey, publicKey, intl]);

  const result = useMemo(
    () => ({ publicKey, contactCardAccessId }),
    [publicKey, contactCardAccessId],
  );
  return result;
};

export default useQRCodeKey;

export const getPublicKeyForProfileId = (profileId: string) => {
  return encryptedQrCodeStorage.getString(
    `${PUBLIC_KEY_STORAGE_KEY}:${profileId}`,
  );
};

export const addOnPublicKeysChangeListener = (listener: () => void) => {
  return encryptedQrCodeStorage.addOnValueChangedListener(listener);
};

export const getOrCreateQrCodeKey = async (
  profileKey?: useQRCodeKey_profile$key | null,
) => {
  const data = readProfileData(profileKey);
  const { contactCardAccessId, id } = data || {};
  if (!id) {
    return null;
  }
  const publicKey = getPublicKeyForProfileId(id);
  if (!publicKey || !contactCardAccessId) {
    const key = await generateQRCodeKey(id);
    encryptedQrCodeStorage.set(`${PUBLIC_KEY_STORAGE_KEY}:${id}`, key);
    return { contactCardAccessId, publicKey: key };
  }
  return { contactCardAccessId, publicKey };
};
