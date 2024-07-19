import { z } from 'zod';
import {
  colorValidatorWithPalette,
  defaultStringValidator,
  fontSizeValidator,
} from '#helpers/validationHelpers';

export const cardStyleSchema = z.object({
  label: z.string().min(1),
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
  buttonRadius: z.number(),
});

export type CardStyleErrors = z.inferFlattenedErrors<typeof cardStyleSchema>;
