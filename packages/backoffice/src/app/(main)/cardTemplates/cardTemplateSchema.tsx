import { z } from 'zod';

export const coverTemplateSchema = z.object({
  labels: z.record(z.string()),
  profileCategories: z.array(z.string().nonempty()).optional().nullable(),
  companyActivities: z.array(z.string().nonempty()).optional().nullable(),
  cardStyle: z.string().nonempty(),
  modules: z.array(z.any()),
  businessEnabled: z.boolean(),
  personalEnabled: z.boolean(),
});

export type CardTemplateFormValue = z.infer<typeof coverTemplateSchema>;

export type CardTemplateErrors = z.inferFlattenedErrors<
  typeof coverTemplateSchema
>;
