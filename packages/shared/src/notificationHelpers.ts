export type PushNotificationData =
  | {
      type: 'multiuser_invitation';
    }
  | {
      type: 'shareBack';
      webCardId: string;
    }
  | {
      type: 'webCardUpdate';
      webCardId: string;
    };

export const isSupportedNotificationData = (
  data?: Record<string, unknown>,
): data is PushNotificationData =>
  !!data &&
  'type' in data &&
  (data.type === 'multiuser_invitation' ||
    (data.type === 'shareBack' && typeof data.webCardId === 'string') ||
    (data.type === 'webCardUpdate' && typeof data.webCardId === 'string'));
