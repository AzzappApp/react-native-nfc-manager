import { createId } from '@paralleldrive/cuid2';
import { eq, and } from 'drizzle-orm';
import db, { cols } from './db';
import type { DbTransaction } from './db';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export const ColorPaletteTable = cols.table('ColorPalette', {
  id: cols.cuid('id').notNull().primaryKey().$defaultFn(createId),
  primary: cols.color('primary').notNull(),
  dark: cols.color('dark').notNull(),
  light: cols.color('light').notNull(),
  enabled: cols.boolean('enabled').default(true).notNull(),
});

export type ColorPalette = InferSelectModel<typeof ColorPaletteTable>;
export type NewColorPalette = InferInsertModel<typeof ColorPaletteTable>;

/**
 * Retrieve a colorPalette by its id.
 * @param id - The id of the colorPalette to retrieve
 * @returns the colorPalette, or null if no colorPalette was found
 */
export const getColorPaletteById = (id: string) =>
  db
    .select()
    .from(ColorPaletteTable)
    .where(eq(ColorPaletteTable.id, id))
    .then(rows => rows[0] ?? null);

/**
 * Retrieve a colorPalette by its colors.
 * @param primary - The primary of the colorPalette to retrieve
 * @param dark - The dark of the colorPalette to retrieve
 * @param light - The light of the colorPalette to retrieve
 * @returns the colorPalette, or null if no colorPalette was found
 */
export const getColorPaletteByColors = (
  primary: string,
  dark: string,
  light: string,
) =>
  db
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

/**
 * Create a colorPalette.
 *
 * @param colorPalette - the colorPalette fields, excluding the id
 * @param tx - The query creator to use (user for transactions)
 * @returns The created colorPalette
 */
export const createColorPalette = async (
  newColorPalette: NewColorPalette,
  tx: DbTransaction = db,
) => {
  const id = createId();
  await tx.insert(ColorPaletteTable).values({ ...newColorPalette, id });
  return id;
};

/**
 * Update a color palette.
 *
 * @param id - The id of the color palette to update
 * @param values - the color palette fields, excluding the id and the cardDate
 * @param tx - The query creator to use (profile for transactions)
 */
export const updateColorPalette = async (
  id: string,
  values: Partial<ColorPalette>,
  tx: DbTransaction = db,
) => {
  await tx
    .update(ColorPaletteTable)
    .set({ ...values })
    .where(eq(ColorPaletteTable.id, id));
};

/**
 * Return a list of color palettes. filtered by profile kind and template kind
 */
export const getColorPalettes = async (): Promise<ColorPalette[]> =>
  db
    .select()
    .from(ColorPaletteTable)
    .where(eq(ColorPaletteTable.enabled, true));
