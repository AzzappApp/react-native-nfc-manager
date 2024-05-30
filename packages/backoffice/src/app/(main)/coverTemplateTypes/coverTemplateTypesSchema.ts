import { z } from 'zod';

export const coverTemplateTypesSchema = z.object({
  order: z.number().int().gte(0),
  labelKey: z.string().min(1),
  baseLabelValue: z.string().min(1),
  enabled: z.boolean(),
});

export type CoverTemplateTypeFormValue = z.infer<
  typeof coverTemplateTypesSchema
>;

export type CoverTemplateTypeErrors = z.inferFlattenedErrors<
  typeof coverTemplateTypesSchema
>;
