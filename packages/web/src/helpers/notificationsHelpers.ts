import { SignJWT, importPKCS8 } from 'jose'; // because of  edge (jsonwebToken, google-auth-library, etc are not supported on "you can do nothing" edge)import { getFcmTokensForUserId } from '@azzapp/data';
import { getFcmTokensForUserId } from '@azzapp/data';
import {
  getImageURLForSize,
  getVideoThumbnailURL,
} from '@azzapp/shared/imagesHelpers';
import { getServerIntl } from './i18nHelpers';
import type { Locale } from '@azzapp/i18n';

let accessToken: string | null = null;
let tokenExpiry = 0;
type MessageType = {
  type: 'multiuser_invitation' | 'shareBack';
  mediaId?: string | null;
  sound?: string; // sound is optionnal, default will use the default sound, for custom sound they have to be compiled with the app
  deepLink?: string;
  locale: Locale;
  localeParams?: Record<string, string>;
};
export const sendPushNotification = async (
  targetUserId: string,
  {
    type,
    mediaId,
    sound = 'default',
    deepLink,
    locale,
    localeParams,
  }: MessageType,
) => {
  const fcms = await getFcmTokensForUserId(targetUserId);
  if (fcms.length === 0) {
    return;
  }
  if (accessToken === null) {
    accessToken = await getAccessToken();
  }

  const message: Record<string, any> = {
    notification: {
      ...getLabel(type, locale, localeParams),
    },
  };

  let imageUrl = undefined;
  if (mediaId) {
    if (mediaId.startsWith('v')) {
      imageUrl = getVideoThumbnailURL({
        id: mediaId,
        width: 37.5,
        height: 60,
      });
    } else {
      imageUrl = getImageURLForSize({
        id: mediaId,
        width: 37.5,
        height: 60,
      });
    }
  }

  for (const fcm of fcms) {
    if (fcm.fcmToken) {
      message.token = fcm.fcmToken;
      if (fcm.deviceOS === 'ios') {
        message.apns = {
          payload: {
            aps: {
              sound,
              'mutable-content': 1,
            },
            deepLink,
          },
          fcm_options: {
            image: imageUrl,
          },
        };
      } else if (fcm.deviceOS === 'android') {
        message.android = {
          notification: {
            sound,
            image: imageUrl,
          },
          data: {
            deepLink,
          },
        };
      }

      try {
        await fetch(
          `https://fcm.googleapis.com/v1/projects/${process.env.FIREBASE_PROJECT_ID!}/messages:send`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ message }),
          },
        );
      } catch (error) {
        console.error('Unexpected error:', error);
      }
    }
  }
};

//we could have use google auth library jS, or even jwtjsonwebtoken, but they are not supported on "you can't do nothing" vercel edge
async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  if (accessToken && now < tokenExpiry) {
    return accessToken;
  }

  const privateKey = await importPKCS8(
    process.env.FIREBASE_PRIVATE_KEY!,
    'RS256',
  );

  const payload = {
    iss: process.env.FIREBASE_CLIENT_EMAIL,
    sub: process.env.FIREBASE_CLIENT_EMAIL,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
  };

  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .sign(privateKey);

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Error fetching token:', errorData);
    throw new Error('Failed to fetch token');
  }
  const responseData = await response.json();
  accessToken = responseData.access_token;
  tokenExpiry = now + 3600;
  return accessToken;
}

const getLabel = (
  type: string,
  locale: Locale,
  params?: Record<string, string>,
) => {
  const intl = getServerIntl(locale);
  switch (type) {
    case 'multiuser_invitation':
      return {
        title: intl.formatMessage({
          defaultMessage: 'Invitation',
          id: 'VTvMCa',
          description: 'Push Notification title for multiuser invitation',
        }),
        body: intl.formatMessage(
          {
            defaultMessage: 'You have been invited to join {userName}',
            id: '8oY4VO',
            description:
              'Push Notification body message for multiuser invitation',
          },
          {
            userName: params?.userName,
          },
        ),
      };
    case 'shareBack':
      return {
        title: intl.formatMessage({
          defaultMessage: 'Contact ShareBack',
          id: '0j4O2Z',
          description: 'Push Notification title for contact share back',
        }),
        body: intl.formatMessage({
          defaultMessage: `Hello, You've received a new contact ShareBack.`,
          id: 'rAeWtj',
          description: 'Push Notification body message for contact share back',
        }),
      };
    default:
      //should not happen,
      return { title: 'Notification', body: 'You have a new notification' };
  }
};
