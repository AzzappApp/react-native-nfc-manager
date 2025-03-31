import { externalFunction } from './GraphQLContext';
import type { AddContactInput } from '#__generated__/types';
import type { Profile, WebCard } from '@azzapp/data';
import type { Locale } from '@azzapp/i18n';
import type { PushNotificationType } from '@azzapp/shared/notificationHelpers';

type Parameters = {
  profile?: Profile;
  contact?: Partial<AddContactInput>;
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

type MessageType = {
  notification: PushNotificationType;
  mediaId?: string | null;
  sound?: string;
  locale: Locale;
  localeParams?: Record<string, string>;
};

export const sendPushNotification = externalFunction<
  (
    targetUserId: string,
    { notification, mediaId, sound, locale, localeParams }: MessageType,
  ) => Promise<void>
>('sendPushNotification');

export const sendEmailSignatures = externalFunction<
  (profileIds: string[], webCard: WebCard) => Promise<void>
>('sendEmailSignatures');

export const notifyWebCardUsers =
  externalFunction<
    (webCardId: WebCard, previousUpdatedAt: Date) => Promise<void>
  >('notifyWebCardUsers');
