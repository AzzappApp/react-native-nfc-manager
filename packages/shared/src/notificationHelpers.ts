const notificationTypes = [
  'multiuser_invitation',
  'shareBack',
  'webCardUpdate',
] as const;

export type NotificationType = (typeof notificationTypes)[number];

type BaseNotification<T extends NotificationType> = {
  type: T;
};

type ShareBackNotification = BaseNotification<'shareBack'> & {
  webCardId: string;
};

type MultiUserInvitationNotification = BaseNotification<'multiuser_invitation'>;

type WebCardUpdateNotification = BaseNotification<'webCardUpdate'> & {
  webCardId: string;
};

export type PushNotificationType =
  | MultiUserInvitationNotification
  | ShareBackNotification
  | WebCardUpdateNotification;

export const isSupportedNotificationType = (
  type?: object | string,
): type is NotificationType =>
  !!type &&
  (notificationTypes as unknown as Array<object | string>).includes(type);
