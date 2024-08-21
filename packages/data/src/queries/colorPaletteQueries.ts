import { eq, and } from 'drizzle-orm';
import { db } from '../database';
import { ColorPaletteTable } from '../schema';
import type { ColorPalette } from '../schema';
import type { InferInsertModel } from 'drizzle-orm';

/**
 * Retrieve a color palette by its id.
 *
 * @param id - The id of the color palette to retrieve
 * @returns the color palette, or null if no colorPalette was found
 */
export const getColorPaletteById = (id: string): Promise<ColorPalette | null> =>
  db()
    .select()
    .from(ColorPaletteTable)
    .where(eq(ColorPaletteTable.id, id))
    .then(rows => rows[0] ?? null);

/**
 * Retrieve a color palette by its colors.
 *
 * @param primary - The primary of the color palette to retrieve
 * @param dark - The dark of the color palette to retrieve
 * @param light - The light of the color palette to retrieve
 * @returns the color palette, or null if no colorPalette was found
 */
export const getColorPaletteByColors = (
  primary: string,
  dark: string,
  light: string,
) =>
  db()
    .select()
    .from(ColorPaletteTable)
    .where(
      and(
        eq(ColorPaletteTable.primary, primary),
        eq(ColorPaletteTable.dark, dark),
        eq(ColorPaletteTable.light, light),
      ),
    )
    .then(rows => rows[0] ?? null);

export type NewColorPalette = InferInsertModel<typeof ColorPaletteTable>;
/**
 * Create a color palette.
 *
 * @param colorPalette - the color palette fields
 * @returns The created color palette id
 */
export const createColorPalette = async (newColorPalette: NewColorPalette) =>
  db()
    .insert(ColorPaletteTable)
    .values(newColorPalette)
    .$returningId()
    .then(res => res[0].id);

/**
 * Update a color palette.
 *
 * @param id - The id of the color palette to update
 * @param values - the updates to apply to the color palette
 */
export const updateColorPalette = async (
  id: string,
  values: Partial<Omit<ColorPalette, 'id'>>,
) => {
  await db()
    .update(ColorPaletteTable)
    .set(values)
    .where(eq(ColorPaletteTable.id, id));
};

/**
 * Retrieves all enabled color palettes.
 *
 * @param enabledOnly - Whether to only retrieve enabled color palettes
 * @returns a list of all enabled color palettes
 */
export const getColorPalettes = async (
  enabledOnly = true,
): Promise<ColorPalette[]> => {
  let query = db().select().from(ColorPaletteTable).$dynamic();

  if (enabledOnly) {
    query = query.where(eq(ColorPaletteTable.enabled, true));
  }
  return query;
};
