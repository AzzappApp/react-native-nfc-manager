import { fetchJSON } from '@azzapp/shared/networkHelpers';
import env from './env';

const TWILIO_ACCOUNT_SID = env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = env.TWILIO_AUTH_TOKEN;
const TWILIO_ACCOUNT_VERIFY_SERVICE_SID = env.TWILIO_ACCOUNT_VERIFY_SERVICE_SID;
export const TWILIO_PHONE_NUMBER = env.TWILIO_PHONE_NUMBER;

const TWILIO_API_URL = 'https://api.twilio.com/2010-04-01/Accounts/';
const TWILIO_VERIFICATION_SERVICE_URL =
  'https://verify.twilio.com/v2/Services/';

const callTwilioAPI = async <T>(
  service: 'messaging' | 'verification',
  path: string,
  params: Record<string, string>,
) => {
  const url = [
    service === 'messaging' ? TWILIO_API_URL : TWILIO_VERIFICATION_SERVICE_URL,
    service === 'messaging'
      ? `${TWILIO_ACCOUNT_SID}${path}`
      : `${TWILIO_ACCOUNT_VERIFY_SERVICE_SID}${path}`,
  ].join('');
  const searchParams = new URLSearchParams(params);

  const auth = Buffer.from(
    `${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`,
  ).toString('base64');

  return fetchJSON<T>(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: searchParams,
  });
};

type TwilioVerificationResponse = {
  sid: string;
  service_sid: string;
  account_sid: string;
  to: string;
  channel: string;
  status: string;
  valid: boolean;
  date_created: string;
  date_updated: string;
  lookup: Record<string, string>;
  amount: null;
  payee: null;
  send_code_attempts: Array<{
    time: string;
    channel: string;
    attempt_sid: string;
  }>;
  sna: null;
  url: string;
};

export const sendTwilioVerificationCode = async (
  to: string,
  channel: 'email' | 'sms',
  locale?: string | null,
) => {
  locale = findTwilioLocale(locale ?? 'en');
  return callTwilioAPI<TwilioVerificationResponse>(
    'verification',
    '/Verifications',
    {
      To: to,
      Channel: channel,
      Locale: locale,
    },
  );
};

type TwilioVerificationCheckResponse = {
  sid: string;
  service_sid: string;
  account_sid: string;
  to: string;
  channel: string;
  status: string;
  valid: boolean;
  amount: null;
  payee: null;
  sna_attempts_error_codes: string[];
  date_created: string;
  date_updated: string;
};

export const checkTwilioVerificationCode = async (to: string, code: string) => {
  return callTwilioAPI<TwilioVerificationCheckResponse>(
    'verification',
    '/VerificationCheck',
    {
      To: to,
      Code: code,
    },
  );
};

type TwilioMessageResponse = {
  account_sid: string;
  api_version: string;
  body: string;
  date_created: string;
  date_sent: string;
  date_updated: string;
  direction: string;
  error_code: null;
  error_message: null;
  from: string;
  num_media: string;
  num_segments: string;
  price: null;
  price_unit: null;
  messaging_service_sid: string;
  sid: string;
  status: string;
  subresource_uris: {
    media: string;
  };
  tags: Record<string, string>;
  to: string;
  uri: string;
};

export const sendTwilioSMS = async ({
  to,
  body,
  mediaUrl,
}: {
  to: string;
  body: string;
  mediaUrl?: string | null;
}) => {
  const params: Record<string, string> = {
    To: to,
    From: TWILIO_PHONE_NUMBER,
    Body: body,
  };
  if (mediaUrl) {
    params['MediaUrl'] = mediaUrl;
  }
  return callTwilioAPI<TwilioMessageResponse>(
    'messaging',
    '/Messages.json',
    params,
  );
};

const TWILIO_SUPPORTED_LOCALE = [
  'af',
  'ar',
  'ca',
  'zh',
  'zh-HK',
  'hr',
  'cs',
  'da',
  'nl',
  'en',
  'et',
  'fi',
  'fr',
  'de',
  'el',
  'he',
  'hi',
  'hu',
  'id',
  'it',
  'ja',
  'kn',
  'ko',
  'lt',
  'ms',
  'mr',
  'nb',
  'pl',
  'pt-BR',
  'pt',
  'ro',
  'ru',
  'sk',
  'es',
  'sv',
  'tl',
  'te',
  'th',
  'tr',
  'uk',
  'vi',
] as const; //see https://www.twilio.com/docs/verify/supported-languages#verify-default-template

export const findTwilioLocale = (
  locale: string,
): (typeof TWILIO_SUPPORTED_LOCALE)[number] => {
  let result = TWILIO_SUPPORTED_LOCALE.find(loc => loc === locale);
  if (!result) {
    result =
      TWILIO_SUPPORTED_LOCALE.find(loc => loc === locale.split('-')[0]) ?? 'en';
  }
  return result;
};
