import * as z from 'zod';
import { isValidUrl } from '@azzapp/shared/stringHelpers';

export const commonInformationSchema = z.object({
  company: z.string().nullable(),
  phoneNumbers: z.array(
    z.object({
      label: z.string(),
      number: z.string(),
    }),
  ),
  emails: z.array(
    z.object({
      label: z.string(),
      address: z.string().email(),
    }),
  ),
  urls: z.array(
    z.object({
      address: z.string().refine(address => isValidUrl(address)),
    }),
  ),
  addresses: z.array(
    z.object({
      label: z.string(),
      address: z.string(),
    }),
  ),
  socials: z.array(
    z.object({
      url: z.string(),
      label: z.string(),
    }),
  ),
  logo: z
    .object({
      uri: z.string(),
      id: z.string().optional(),
      local: z.boolean().optional(),
    })
    .optional()
    .nullable(),
});

export type CommonInformationForm = z.infer<typeof commonInformationSchema>;
