import * as z from 'zod';
import { phoneNumberSchema } from '#helpers/phoneNumbersHelper';

export const baseContactCardSchema = z.object({
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
      address: z.string(),
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
      external: z.boolean().optional(),
    })
    .optional()
    .nullable(),
  logo: z
    .object({
      uri: z.string(),
      id: z.string().optional(),
      local: z.boolean().optional(),
      width: z.number().optional(),
      height: z.number().optional(),
    })
    .optional()
    .nullable(),
});
