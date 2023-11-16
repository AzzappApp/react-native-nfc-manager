import { z } from 'zod';

export const companyActivitySchema = z.object({
  labels: z.record(z.string()),
  cardTemplateTypeId: z.string().optional().nullable(),
});

export type CompanyActivityFormValue = z.infer<typeof companyActivitySchema>;

export type CompanyActivityErrors = z.inferFlattenedErrors<
  typeof companyActivitySchema
>;
