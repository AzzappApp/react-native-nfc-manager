import * as ed from '@noble/ed25519';
import * as Sentry from '@sentry/react-native';
import { fromGlobalId } from 'graphql-relay';
import { useEffect, useRef } from 'react';
import { useIntl } from 'react-intl';
import { MMKV, useMMKVObject } from 'react-native-mmkv';
import { fromByteArray } from 'react-native-quick-base64';
import Crypto from 'react-native-quick-crypto';
import Toast from 'react-native-toast-message';
import { commitMutation, graphql } from 'react-relay';
import { getAuthState } from '#helpers/authStore';
import { getRelayEnvironment } from '#helpers/relayEnvironment';
import type { useQRCodeKeyStoreMutation } from '#relayArtifacts/useQRCodeKeyStoreMutation.graphql';

const encryptedQrCodeStorage = new MMKV({
  id: `encrypted-qrcode-storage`,
  encryptionKey: '@azzapp-qrcode-encryption-key',
});

const DEVICE_ID_STORAGE_KEY = 'deviceId-v2';

export const getQRCodeDeviceId = () => {
  let deviceId = encryptedQrCodeStorage.getString(DEVICE_ID_STORAGE_KEY);

  if (!deviceId) {
    deviceId = Crypto.randomUUID();
    encryptedQrCodeStorage.set(DEVICE_ID_STORAGE_KEY, deviceId);
  }
  return deviceId;
};

const deviceId = getQRCodeDeviceId();

const PUBLIC_KEY_STORAGE_KEY = 'qrCodeKeyForProfile';

const generateQRCodeKey = async (profileId: string) => {
  const message = new TextEncoder().encode(fromGlobalId(profileId).id);
  const privateKey = ed.utils.randomPrivateKey();

  const publicKey = await ed.getPublicKeyAsync(privateKey);
  const signature = await ed.signAsync(message, privateKey);

  return new Promise<{
    publicKey: string;
    contactCardAccessId: string;
  }>((resolve, reject) => {
    commitMutation<useQRCodeKeyStoreMutation>(getRelayEnvironment(), {
      mutation: graphql`
        mutation useQRCodeKeyStoreMutation(
          $input: SaveContactCardAccessInput!
        ) {
          saveContactCardAccess(input: $input) {
            contactCardAccessId
          }
        }
      `,
      variables: {
        input: {
          deviceId,
          profileId,
          signature: fromByteArray(signature),
        },
      },
      onError: error => {
        reject(error);
      },
      onCompleted: response => {
        const contactCardAccessId =
          response.saveContactCardAccess?.contactCardAccessId;
        if (!contactCardAccessId) {
          return reject(new Error('Failed to retrieve contact card access ID'));
        }
        resolve({
          publicKey: fromByteArray(publicKey),
          contactCardAccessId,
        });
      },
    });
  });
};

const useQRCodeKey = () => {
  const profileInfos = getAuthState().profileInfos;
  const id = profileInfos?.profileId;

  const [qrCodeKey, setQrCodeKey] = useMMKVObject<{
    publicKey: string;
    contactCardAccessId: string;
  }>(`${PUBLIC_KEY_STORAGE_KEY}:${id}`, encryptedQrCodeStorage);

  const buildingKeyPair = useRef(false);

  const intl = useIntl();

  useEffect(() => {
    if (id && !qrCodeKey && !buildingKeyPair.current) {
      buildingKeyPair.current = true;

      (async () => {
        generateQRCodeKey(id).then(
          key => {
            setQrCodeKey(key);
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
  }, [id, qrCodeKey, setQrCodeKey, intl]);

  return qrCodeKey;
};

export default useQRCodeKey;

export const getPublicKeyForProfileId = (profileId: string) => {
  const qrCodeKey = encryptedQrCodeStorage.getString(
    `${PUBLIC_KEY_STORAGE_KEY}:${profileId}`,
  );

  const parsedQrCodeKey = qrCodeKey
    ? (JSON.parse(qrCodeKey) as {
        contactCardAccessId?: string;
        publicKey?: string;
      })
    : null;

  if (!parsedQrCodeKey?.contactCardAccessId || !parsedQrCodeKey?.publicKey) {
    return null;
  }
  return {
    contactCardAccessId: parsedQrCodeKey.contactCardAccessId,
    publicKey: parsedQrCodeKey.publicKey,
  };
};

export const addOnPublicKeysChangeListener = (listener: () => void) => {
  return encryptedQrCodeStorage.addOnValueChangedListener(listener);
};

export const getOrCreateQrCodeKey = async () => {
  const profileInfos = getAuthState().profileInfos;
  const id = profileInfos?.profileId;
  if (!id) {
    return null;
  }
  const qrCodeKey = getPublicKeyForProfileId(id);

  if (!qrCodeKey) {
    const key = await generateQRCodeKey(id);
    encryptedQrCodeStorage.set(
      `${PUBLIC_KEY_STORAGE_KEY}:${id}`,
      JSON.stringify(key),
    );
    return key;
  }
  return qrCodeKey;
};
