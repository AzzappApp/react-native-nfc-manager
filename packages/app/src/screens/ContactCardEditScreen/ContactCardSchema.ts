import * as z from 'zod';

export const contactCardSchema = z.object({
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
  phoneNumbers: z.array(
    z.object({
      label: z.string(),
      number: z.string(),
      selected: z.boolean().nullable().optional(),
    }),
  ),
  emails: z.array(
    z.object({
      label: z.string(),
      address: z.string(),
      selected: z.boolean().nullable().optional(),
    }),
  ),
  urls: z.array(
    z.object({
      address: z.string(),
      selected: z.boolean().nullable().optional(),
    }),
  ),
  addresses: z.array(
    z.object({
      label: z.string(),
      address: z.string(),
      selected: z.boolean().nullable().optional(),
    }),
  ),
  birthday: z
    .object({
      birthday: z.string(),
      selected: z.boolean().nullable().optional(),
    })
    .nullable()
    .optional(),
  socials: z.array(
    z.object({
      url: z.string(),
      label: z.string(),
      selected: z.boolean().nullable().optional(),
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
  webCardKind: z.string().optional().nullable(),
  companyActivityLabel: z.string().optional().nullable(),
  companyUrl: z.string().optional().nullable(),
});

export type ContactCardFormValues = z.infer<typeof contactCardSchema>;
