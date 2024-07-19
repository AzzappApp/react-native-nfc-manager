import { z } from 'zod';

export const coverTemplateTagsSchema = z.object({
  order: z.number().int().gte(0),
  label: z.string().min(1),
  enabled: z.boolean(),
});

export type CoverTemplateTagFormValue = z.infer<typeof coverTemplateTagsSchema>;

export type CoverTemplateTagErrors = z.inferFlattenedErrors<
  typeof coverTemplateTagsSchema
>;
