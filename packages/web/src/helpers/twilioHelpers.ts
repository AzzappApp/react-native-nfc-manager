import { Twilio } from 'twilio';

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID!;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN!;
const TWILIO_ACCOUNT_VERIFY_SERVICE_SID =
  process.env.TWILIO_ACCOUNT_VERIFY_SERVICE_SID!;

const twilioClient = new Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

export const twilioVerificationService = await twilioClient.verify.v2.services(
  TWILIO_ACCOUNT_VERIFY_SERVICE_SID,
);

export const twilioMessagesService = twilioClient.messages;

export const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER!;
