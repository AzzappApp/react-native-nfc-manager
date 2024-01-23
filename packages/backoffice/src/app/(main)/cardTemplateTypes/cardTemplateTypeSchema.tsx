import { z } from 'zod';

export const cardTemplateTypeSchema = z.object({
  labels: z.record(z.string()),
  webCardCategory: z.string().or(z.object({ id: z.string() })),
});

export type CardTemplateTypeFormValue = z.infer<typeof cardTemplateTypeSchema>;

export type CardTemplateTypeErrors = z.inferFlattenedErrors<
  typeof cardTemplateTypeSchema
>;
