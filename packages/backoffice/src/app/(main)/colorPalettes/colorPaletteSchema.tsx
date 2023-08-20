import { z } from 'zod';
import { colorValidator } from '#helpers/validationHelpers';

export const colorPaletteSchema = z.object({
  primary: colorValidator,
  light: colorValidator,
  dark: colorValidator,
  enabled: z.boolean(),
});

export type ColorPaletteErrors = z.inferFlattenedErrors<
  typeof colorPaletteSchema
>;
