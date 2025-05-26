import * as ed from '@noble/ed25519';
import * as Sentry from '@sentry/react-native';
import { fromGlobalId } from 'graphql-relay';
import { useEffect, useRef } from 'react';
import { useIntl } from 'react-intl';
import { MMKV, useMMKVString } from 'react-native-mmkv';
import { fromByteArray } from 'react-native-quick-base64';
import Crypto from 'react-native-quick-crypto';
import Toast from 'react-native-toast-message';
import { graphql, useFragment, useMutation } from 'react-relay';
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

const useQRCodeKey = (profileKey?: useQRCodeKey_profile$key | null) => {
  const data = useFragment(
    graphql`
      fragment useQRCodeKey_profile on Profile
      @argumentDefinitions(
        deviceId: { type: "String!", provider: "qrCodeDeviceId.relayprovider" }
      ) {
        id
        contactCardAccessId(deviceId: $deviceId)
      }
    `,
    profileKey,
  );

  const { contactCardAccessId, id } = data || {};

  const [commit] = useMutation(graphql`
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
  `);

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

      const message = new TextEncoder().encode(fromGlobalId(id).id);
      const privateKey = ed.utils.randomPrivateKey();

      (async () => {
        const publicKey = await ed.getPublicKeyAsync(privateKey);
        const signature = await ed.signAsync(message, privateKey);
        commit({
          variables: {
            input: {
              deviceId,
              profileId: id,
              signature: fromByteArray(signature),
            },
            deviceId,
          },
          onError: error => {
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
          onCompleted: () => {
            setPublicKey(fromByteArray(publicKey));
            buildingKeyPair.current = false;
          },
        });
      })();
    }
  }, [commit, contactCardAccessId, id, setPublicKey, publicKey, intl]);

  return publicKey;
};

export const getPublicKeyForProfileId = (profileId: string) => {
  return encryptedQrCodeStorage.getString(
    `${PUBLIC_KEY_STORAGE_KEY}:${profileId}`,
  );
};

export const addOnPublicKeysChangeListener = (listener: () => void) => {
  return encryptedQrCodeStorage.addOnValueChangedListener(listener);
};

export default useQRCodeKey;
