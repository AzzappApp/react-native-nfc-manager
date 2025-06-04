import { z } from 'zod';

export const schema = z.object({
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z
    .string()
    .default('azzapp-dev')
    .describe('Cloudinary cloud name'),
  CLOUDINARY_API_KEY: z.string().default('').describe('Cloudinary API key'),
  CLOUDINARY_API_SECRET: z
    .string()
    .default('')
    .describe('Cloudinary API secret'),
  NEXT_PUBLIC_CLOUDINARY_SECURE_DISTRIBUTION: z
    .string()
    .optional()
    .describe('Cloudinary secure distribution'),
  CONTACT_CARD_SIGNATURE_SECRET: z
    .string()
    .default('')
    .describe(
      'Contact card signature secret use to sign exchanged contact infos',
    ),
  SENDGRID_API_KEY: z.string().default('').describe('SendGrid API key'),
  SENDGRID_NOREPLY_SENDER: z
    .string()
    .default('noreply@azzapp.com')
    .describe('SendGrid no-reply sender email'),
  FIREBASE_PROJECT_ID: z.string().default('').describe('Firebase project ID'),
  FIREBASE_CLIENT_EMAIL: z
    .string()
    .default('')
    .describe('Firebase client email'),
  FIREBASE_PRIVATE_KEY: z.string().default('').describe('Firebase private key'),
  NEXT_PUBLIC_PLATFORM: z
    .string()
    .default('development')
    .describe('Platform environment'),
  TWILIO_ACCOUNT_SID: z.string().default('').describe('Twilio account SID'),
  TWILIO_AUTH_TOKEN: z.string().default('').describe('Twilio auth token'),
  TWILIO_ACCOUNT_VERIFY_SERVICE_SID: z
    .string()
    .default('')
    .describe('Twilio account verify service SID'),
  TWILIO_PHONE_NUMBER: z
    .string()
    .default('')
    .describe('Twilio phone number to send SMS from'),
});

const env = schema.safeParse(process.env);

if (!env.success) {
  console.error(
    '❌ service - invalid environment variables:',
    env.error.format(),
  );
}

export default env.data!;
