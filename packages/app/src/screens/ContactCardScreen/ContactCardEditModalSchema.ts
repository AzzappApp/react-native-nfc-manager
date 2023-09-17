import * as z from 'zod';

export const contactCardEditSchema = z.object({
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  title: z.string().nullable(),
  company: z.string().nullable(),
  phoneNumbers: z.array(
    z.object({
      label: z.string(),
      number: z.string(),
      selected: z.boolean(),
    }),
  ),
  emails: z.array(
    z.object({
      label: z.string(),
      address: z.string(),
      selected: z.boolean(),
    }),
  ),
  urls: z.array(
    z.object({
      address: z.string(),
      selected: z.boolean(),
    }),
  ),
  addresses: z.array(
    z.object({
      label: z.string(),
      address: z.string(),
      selected: z.boolean(),
    }),
  ),
  birthdays: z.array(
    z.object({
      birthday: z.string(),
      selected: z.boolean(),
    }),
  ),
  socials: z.array(
    z.object({
      social: z.string(),
      selected: z.boolean(),
    }),
  ),
});

export type ContactCardEditForm = z.infer<typeof contactCardEditSchema>;
