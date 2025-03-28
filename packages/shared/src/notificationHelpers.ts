const notificationTypes = [
  'multiuser_invitation',
  'shareBack',
  'webCardUpdate',
] as const;

export type NotificationType = (typeof notificationTypes)[number];

export const isSupportedNotificationType = (
  type?: object | string,
): type is NotificationType =>
  !!type &&
  (notificationTypes as unknown as Array<object | string>).includes(type);
