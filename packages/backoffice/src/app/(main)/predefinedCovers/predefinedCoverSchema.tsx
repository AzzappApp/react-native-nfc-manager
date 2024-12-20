import { z } from 'zod';
import { colorValidator } from '#helpers/validationHelpers';

export const predefinedCoverSchema = z.object({
  mediaId: z.string(),
  primary: colorValidator,
  light: colorValidator,
  dark: colorValidator,
});

export type PredefinedCoverFormValue = z.infer<typeof predefinedCoverSchema>;

export type PredefinedCoverErrors = z.inferFlattenedErrors<
  typeof predefinedCoverSchema
>;
