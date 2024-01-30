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
      address: z.string(),
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
});

export type CommonInformationForm = z.infer<typeof commonInformationSchema>;
