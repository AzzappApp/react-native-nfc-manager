import * as z from 'zod';
import { baseContactCardSchema } from '#helpers/contactCardHelpers';

export const baseUserDetailsSchema = baseContactCardSchema.extend({
  role: z.enum(['user', 'admin', 'owner', 'editor']),
});

export const multiUserDetailsSchema = baseUserDetailsSchema.extend({
  selectedContact: z
    .object({
      countryCodeOrEmail: z.string(),
      value: z.string(),
    })
    .optional()
    .nullable(),
});
