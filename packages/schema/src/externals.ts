import { externalFunction } from './GraphQLContext';
import type { WebCard } from '@azzapp/data';
import type { Locale } from '@azzapp/i18n';

export const notifyUsers =
  externalFunction<
    (
      type: 'email' | 'phone',
      receivers: string[],
      webCard: WebCard,
      notificationType: 'invitation' | 'transferOwnership',
      locale: Locale,
    ) => Promise<void>
  >('notifyUsers');

export const invalidatePost =
  externalFunction<(webCardUserName: string, postId: string) => void>(
    'invalidatePost',
  );

export const invalidateWebCard =
  externalFunction<(userName: string) => void>('invalidateWebCard');

// TODO the fact that this function is injected in the context is a bit weird
// I guess it should be moved to @azzapp/shared or something like that
export const buildCoverAvatarUrl = externalFunction<
  (webCard: WebCard | null) => Promise<string | null>
>('buildCoverAvatarUrl');

export const validateMailOrPhone = externalFunction<
  (type: 'email' | 'phone', issuer: string, token: string) => Promise<void>
>('validateMailOrPhone');

type MessageType = {
  type: 'multiuser_invitation' | 'shareBack';
  mediaId?: string | null;
  sound?: string;
  deepLink?: string; //maybe we could merge type and deepLink...
  locale: Locale;
  localeParams?: Record<string, string>;
};

export const sendPushNotification = externalFunction<
  (
    targetUserId: string,
    { type, mediaId, sound, deepLink, locale, localeParams }: MessageType,
  ) => Promise<void>
>('sendPushNotification');
