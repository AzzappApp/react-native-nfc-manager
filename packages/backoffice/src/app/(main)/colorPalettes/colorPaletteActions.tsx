'use server';

import { revalidatePath } from 'next/cache';
import { createColorPalette, updateColorPalette } from '@azzapp/data/domains';
import { ADMIN } from '#roles';
import { currentUserHasRole } from '#helpers/roleHelpers';
import { colorPaletteSchema } from './colorPaletteSchema';
import type { ColorPalette, NewColorPalette } from '@azzapp/data/domains';

export const saveColorPalette = async (
  data: ColorPalette | NewColorPalette,
) => {
  if (!(await currentUserHasRole(ADMIN))) {
    throw new Error('Unauthorized');
  }
  const validationResult = colorPaletteSchema.safeParse(data);
  if (!validationResult.success) {
    return {
      success: false,
      formErrors: validationResult.error.formErrors,
    } as const;
  }
  let colorPaletteId: string;
  if (data.id) {
    const { id, ...updates } = data;
    await updateColorPalette(id, updates);
    colorPaletteId = id;
  } else {
    const id = await createColorPalette(data);
    colorPaletteId = id;
  }
  revalidatePath(`/colorPalettes/[id]`);
  return { success: true, colorPaletteId } as const;
};
