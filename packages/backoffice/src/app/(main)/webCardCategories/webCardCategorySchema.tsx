import { z } from 'zod';

export const webCardCategorySchema = z.object({
  webCardKind: z.union([z.literal('personal'), z.literal('business')]),
  order: z.number().int().gte(0),
  labelKey: z.string().min(1),
  baseLabelValue: z.string().min(1),
  medias: z.array(z.string()),
  activities: z
    .array(z.union([z.string(), z.object({ id: z.string() })]))
    .optional(),
  enabled: z.boolean(),
});

export type WebCardCategoryErrors = z.inferFlattenedErrors<
  typeof webCardCategorySchema
>;
