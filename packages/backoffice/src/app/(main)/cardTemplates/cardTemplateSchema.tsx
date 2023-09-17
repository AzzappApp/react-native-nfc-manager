import { z } from 'zod';

export const cardTemplateSchema = z.object({
  labels: z.record(z.string()),
  profileCategories: z.array(z.string().nonempty()).optional().nullable(),
  companyActivities: z.array(z.string().nonempty()).optional().nullable(),
  cardStyle: z.string().nonempty(),
  modules: z.array(z.any()),
  previewMediaId: z.string().nonempty(),
  businessEnabled: z.boolean(),
  personalEnabled: z.boolean(),
});

export type CardTemplateFormValue = z.infer<typeof cardTemplateSchema>;

export type CardTemplateErrors = z.inferFlattenedErrors<
  typeof cardTemplateSchema
>;
