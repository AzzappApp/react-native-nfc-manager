import { z } from 'zod';

export const emailSchema = z.string().optional();

export const ShareBackFormSchema = z
  .object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    title: z.string().optional(),
    company: z.string().optional(),
    countryCode: z.string(),
    number: z.string().optional(),
    email: emailSchema,
  })
  .refine(
    data => {
      return Object.values(data).some(
        value => value !== undefined && value !== '',
      );
    },
    {
      message: 'At least one field must be filled out',
    },
  );
