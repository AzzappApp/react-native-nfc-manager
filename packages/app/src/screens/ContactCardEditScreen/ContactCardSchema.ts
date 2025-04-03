import * as z from 'zod';
import { baseContactCardSchema } from '#helpers/contactCardHelpers';

export const contactCardSchema = baseContactCardSchema.extend({
  webCardKind: z.string().optional().nullable(),
  companyActivityLabel: z.string().optional().nullable(),
  primaryColor: z.string().optional().nullable(),
  expendableColor: z.string().optional().nullable(),
});

export type ContactCardFormValues = z.infer<typeof contactCardSchema>;
