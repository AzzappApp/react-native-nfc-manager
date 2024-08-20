import * as z from 'zod';

export const multiUserDetailsSchema = z.object({
  role: z.string(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  title: z.string().nullable(),
  company: z.string().optional(),
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
    .nullable(),
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
  selectedContact: z
    .object({
      countryCodeOrEmail: z.string(),
      value: z.string(),
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
});
