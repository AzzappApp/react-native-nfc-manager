import { z } from 'zod';

export const cardTemplateSchema = z.object({
  labelKey: z.string().min(1),
  baseLabelValue: z.string().min(1),
  cardStyle: z.string().min(1),
  modules: z.array(z.any()),
  previewMediaId: z.string().min(1),
  businessEnabled: z.boolean(),
  personalEnabled: z.boolean(),
});

export type CardTemplateFormValue = z.infer<typeof cardTemplateSchema>;

export type CardTemplateErrors = z.inferFlattenedErrors<
  typeof cardTemplateSchema
>;
