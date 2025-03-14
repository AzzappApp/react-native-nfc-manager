import * as z from 'zod';
import { phoneNumberSchema } from '#helpers/phoneNumbersHelper';

export const contactSchema = z
  .object({
    notify: z.boolean().default(false),
    firstName: z.string().nullable().optional(),
    lastName: z.string().nullable().optional(),
    title: z.string().nullable().optional(),
    company: z.string().nullable().optional(),
    phoneNumbers: z.array(phoneNumberSchema),
    emails: z.array(
      z.object({
        label: z.string(),
        address: z.string(),
      }),
    ),
    urls: z.array(
      z.object({
        url: z.string(),
      }),
    ),
    addresses: z.array(
      z.object({
        label: z.string(),
        address: z.string(),
      }),
    ),
    birthday: z
      .object({
        birthday: z.string(),
      })
      .nullable()
      .optional(),
    socials: z.array(
      z.object({
        url: z.string(),
        label: z.string(),
      }),
    ),
    avatar: z
      .object({
        uri: z.string(),
        id: z.string().optional(),
        local: z.boolean().optional(),
      })
      .optional()
      .nullable(),
    logo: z
      .object({
        uri: z.string(),
        id: z.string().optional(),
        local: z.boolean().optional(),
      })
      .optional()
      .nullable(),
  })
  .refine(
    data => !!data.firstName || !!data.lastName || !!data.company,
    'Either one of firstname or lastname or company name should be filled in.',
  );

export type ContactFormValues = z.infer<typeof contactSchema>;
