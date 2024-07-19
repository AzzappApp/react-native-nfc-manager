import { z } from 'zod';
import { DEFAULT_VARCHAR_LENGTH } from '@azzapp/data/helpers/constants';

export const colorValidator = z
  .string()
  .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/i);

export const colorValidatorWithPalette = z.union([
  colorValidator,
  z.literal('primary'),
  z.literal('light'),
  z.literal('dark'),
]);

export const defaultStringValidator = z.string().max(DEFAULT_VARCHAR_LENGTH);

export const fontSizeValidator = z.number().int().gte(1).max(100);
