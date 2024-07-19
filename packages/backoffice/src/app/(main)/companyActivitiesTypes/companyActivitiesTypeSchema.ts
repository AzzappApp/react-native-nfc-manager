import { z } from 'zod';

export const companyActivitiesTypeSchema = z.object({
  label: z.string().min(1),
});

export type CompanyActivitiesTypeFormValue = z.infer<
  typeof companyActivitiesTypeSchema
>;

export type CompanyActivitiesTypeErrors = z.inferFlattenedErrors<
  typeof companyActivitiesTypeSchema
>;
