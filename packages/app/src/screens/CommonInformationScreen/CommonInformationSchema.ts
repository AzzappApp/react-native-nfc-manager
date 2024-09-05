import * as z from 'zod';

export const commonInformationSchema = z.object({
  company: z.string().optional().nullable(),
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
      address: z.string(),
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
