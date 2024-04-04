import { z } from 'zod';

export const companyActivitySchema = z.object({
  labelKey: z.string().min(1),
  baseLabelValue: z.string().min(1),
  cardTemplateTypeId: z.string().optional().nullable(),
});

export type CompanyActivityFormValue = z.infer<typeof companyActivitySchema>;

export type CompanyActivityErrors = z.inferFlattenedErrors<
  typeof companyActivitySchema
>;
