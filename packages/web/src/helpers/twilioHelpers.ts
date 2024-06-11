import { Twilio } from 'twilio';

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID!;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN!;
const TWILIO_ACCOUNT_VERIFY_SERVICE_SID =
  process.env.TWILIO_ACCOUNT_VERIFY_SERVICE_SID!;

export const twilioVerificationService = () => {
  const twilioClient = new Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  return twilioClient.verify.v2.services(TWILIO_ACCOUNT_VERIFY_SERVICE_SID);
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
): (typeof TWILIO_SUPPORTED_LOCALE)[number] | undefined => {
  const result = TWILIO_SUPPORTED_LOCALE.find(loc => loc === locale);

  if (!result) {
    return TWILIO_SUPPORTED_LOCALE.find(loc => loc === locale.split('-')[0]);
  }

  return result;
};

export const twilioMessagesService = () => {
  const twilioClient = new Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  return twilioClient.messages;
};

export const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER!;
