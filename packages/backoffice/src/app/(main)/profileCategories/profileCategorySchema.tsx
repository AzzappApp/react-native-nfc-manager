import { z } from 'zod';

export const profileCategorySchema = z.object({
  profileKind: z.union([z.literal('personal'), z.literal('business')]),
  order: z.number().int().gte(0),
  labels: z.record(z.string()),
  medias: z.array(z.string()),
  activities: z
    .array(z.union([z.string(), z.object({ id: z.string() })]))
    .optional(),
  cardTemplateTypeId: z.string().optional().nullable(),
  enabled: z.boolean(),
});

export type ProfileCategoryErrors = z.inferFlattenedErrors<
  typeof profileCategorySchema
>;
