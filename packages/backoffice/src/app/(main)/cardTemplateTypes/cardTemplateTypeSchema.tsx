import { z } from 'zod';

export const cardTemplateTypeSchema = z.object({
  label: z.string().min(1),
  webCardCategory: z.string().or(z.object({ id: z.string() })),
});

export type CardTemplateTypeFormValue = z.infer<typeof cardTemplateTypeSchema>;

export type CardTemplateTypeErrors = z.inferFlattenedErrors<
  typeof cardTemplateTypeSchema
>;
