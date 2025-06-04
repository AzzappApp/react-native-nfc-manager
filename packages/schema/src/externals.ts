import { externalFunction } from './GraphQLContext';
import type { ContactInput } from '#__generated__/types';
import type { Contact, Profile, WebCard } from '@azzapp/data';
import type { Locale } from '@azzapp/i18n';
import type { MessageType } from '@azzapp/service/notificationsHelpers';

type Parameters = {
  profile?: Profile;
  contact?: Partial<ContactInput>;
  publicKey?: string | null;
  contactCardAccessId?: string | null;
};

export const notifyUsers =
  externalFunction<
    (
      type: 'email' | 'phone',
      receivers: string[],
      webCard: WebCard,
      notificationType: 'invitation' | 'transferOwnership' | 'vcard',
      locale: Locale,
      parameters?: Parameters,
    ) => Promise<void>
  >('notifyUsers');

export const invalidatePost =
  externalFunction<(webCardUserName: string, postId: string) => void>(
    'invalidatePost',
  );

export const invalidateWebCard =
  externalFunction<(userName: string) => void>('invalidateWebCard');

export const validateMailOrPhone = externalFunction<
  (type: 'email' | 'phone', issuer: string, token: string) => Promise<void>
>('validateMailOrPhone');

export const notifyApplePassWallet = externalFunction<
  (pushToken: string) => void
>('notifyApplePassWallet');

export const notifyGooglePassWallet = externalFunction<
  (profileId: string, locale: string) => void
>('notifyGooglePassWallet');

export const sendEmailSignatures = externalFunction<
  (profileIds: string[]) => void
>('sendEmailSignatures');

export const sendEmailSignature =
  externalFunction<(profileId: string, deviceId: string, key: string) => void>(
    'sendEmailSignature',
  );

export const notifyWebCardUsers =
  externalFunction<(webCard: WebCard, editorUserId: string) => void>(
    'notifyWebCardUsers',
  );

export const enrichContact =
  externalFunction<(userId: string, contact: Contact) => void>('enrichContact');

export const cancelEnrichContact = externalFunction<
  (userId: string, contactId: string) => void
>('cancelEnrichContact');

export const sendPushNotification = externalFunction<
  (userId: string, message: MessageType) => Promise<void>
>('sendPushNotification');
