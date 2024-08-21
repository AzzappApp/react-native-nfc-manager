import { z } from 'zod';

export const colorValidator = z
  .string()
  .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/i);

export const colorValidatorWithPalette = z.union([
  colorValidator,
  z.literal('primary'),
  z.literal('light'),
  z.literal('dark'),
]);

/**
 * Importing that from @azzapp/data completely breaks the build
 * because of the circular dependency ? 🤔
 */
export const defaultStringValidator = z.string().max(191);

export const fontSizeValidator = z.number().int().gte(1).max(100);
