import { z } from 'zod';
import {
  colorValidatorWithPalette,
  defaultStringValidator,
  fontSizeValidator,
} from '#helpers/validationHelpers';

export const cardStyleSchema = z.object({
  labels: z.record(z.string()),
  fontFamily: defaultStringValidator,
  fontSize: fontSizeValidator,
  titleFontFamily: defaultStringValidator,
  titleFontSize: fontSizeValidator,
  borderRadius: z.number().gte(0).max(100),
  borderWidth: z.number().int().gte(0).max(100),
  borderColor: colorValidatorWithPalette,
  buttonColor: colorValidatorWithPalette,
  gap: z.number().int().gte(0).max(100),
  enabled: z.boolean(),
});

export type CardStyleErrors = z.inferFlattenedErrors<typeof cardStyleSchema>;
