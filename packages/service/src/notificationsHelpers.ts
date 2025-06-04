import * as Sentry from '@sentry/nextjs';
import { SignJWT, importPKCS8 } from 'jose'; // because of  edge (jsonwebToken, google-auth-library, etc are not supported on "you can do nothing" edge)import { getFcmTokensForUserId } from '@azzapp/data';
import { getFcmTokensForUserId } from '@azzapp/data';
import env from './env';
import {
  getImageURLForSize,
  getVideoThumbnailURL,
} from './mediaServices/imageHelpers';
import type { PushNotificationData } from '@azzapp/shared/notificationHelpers';

let accessToken: string | null = null;
let tokenExpiry = 0;
export type MessageType = {
  mediaId?: string | null;
  sound?: string; // sound is optional, default will use the default sound, for custom sound they have to be compiled with the app
  title: string;
  body: string;
  data?: PushNotificationData;
};

export const sendPushNotification = async (
  targetUserId: string,
  { data, mediaId, sound = 'default', title, body }: MessageType,
) => {
  const fcms = await getFcmTokensForUserId(targetUserId);
  if (fcms.length === 0) {
    return;
  }
  if (accessToken === null) {
    accessToken = await getAccessToken();
  }

  const notification = {
    title,
    body,
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
      let message;
      if (fcm.deviceOS === 'ios') {
        message = {
          notification,
          token: fcm.fcmToken,
          apns: {
            payload: {
              aps: {
                sound,
                'mutable-content': 1,
              },
              ...data,
            },
            fcm_options: {
              image: imageUrl,
            },
          },
        };
      } else if (fcm.deviceOS === 'android') {
        message = {
          token: fcm.fcmToken,
          notification,
          android: {
            notification: {
              sound,
              image: imageUrl,
            },
            data,
          },
        };
      } else {
        message = null;
      }
      if (message) {
        try {
          await fetch(
            `https://fcm.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/messages:send`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({ message }),
            },
          ).then(result => {
            if (result.status !== 200) {
              console.error(
                'cannot send push notification message',
                message,
                ' result is ',
                result,
              );
              Sentry.captureMessage('Fail to send fcm message');
            }
          });
        } catch (error) {
          console.error('Unexpected error:', error);
        }
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

  const privateKey = await importPKCS8(env.FIREBASE_PRIVATE_KEY, 'RS256');

  const payload = {
    iss: env.FIREBASE_CLIENT_EMAIL,
    sub: env.FIREBASE_CLIENT_EMAIL,
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
