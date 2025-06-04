import { z } from 'zod';

export const schema = z.object({
  PAYMENT_API_NAME: z
    .string()
    .default('')
    .describe('Username to connect to the payment API'),
  PAYMENT_API_PASSWORD: z
    .string()
    .default('')
    .describe('Password to connect to the payment API'),
  PAYMENT_API_URL: z
    .string()
    .url()
    .default('')
    .describe('URL to connect to the payment API'),
  PAYMENT_API_SECRET: z
    .string()
    .default('')
    .describe('Secret used to check hash from payment callbacks'),
  PAYMENT_MONTHLY_RECURRENCE: z
    .string()
    .default('31d')
    .describe('Monthly payment recurrence'),
  PAYMENT_YEARLY_RECURRENCE: z
    .string()
    .default('366d')
    .describe('Yearly payment recurrence'),
  NEXT_PUBLIC_PLATFORM: z
    .string()
    .default('development')
    .describe('Platform environment'),
  INVOICING_COMPANY: z
    .string()
    .default('APPCORP')
    .describe('Invoicing company name'),
  INVOICING_EMAIL: z
    .string()
    .email()
    .default('contact@azzapp.com')
    .describe('Invoicing email'),
  INVOICING_ADDRESS: z
    .string()
    .default('3-5 avenue des Citronniers')
    .describe('Invoicing address'),
  INVOICING_ZIP: z.string().default('98000').describe('Invoicing zip code'),
  INVOICING_CITY: z.string().default('Monaco').describe('Invoicing city'),
  INVOICING_COUNTRY: z.string().default('France').describe('Invoicing country'),
  INVOICING_VAT: z
    .string()
    .default('FR68923096283')
    .describe('Invoicing VAT number'),
});

const env = schema.safeParse(process.env);

if (!env.success) {
  console.error(
    '❌ payment - invalid environment variables:',
    env.error.format(),
  );
}

export default env.data!;
