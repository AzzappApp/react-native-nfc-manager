'use server';

import { revalidatePath } from 'next/cache';
import { createCardStyle, updateCardStyle } from '@azzapp/data';
import { ADMIN } from '#roles';
import { currentUserHasRole } from '#helpers/roleHelpers';
import { cardStyleSchema } from './cardStyleSchema';
import type { CardStyle, NewCardStyle } from '@azzapp/data';

export const saveCardStyle = async (data: CardStyle | NewCardStyle) => {
  if (!(await currentUserHasRole(ADMIN))) {
    throw new Error('Unauthorized');
  }
  const validationResult = cardStyleSchema.safeParse(data);
  if (!validationResult.success) {
    return {
      success: false,
      formErrors: validationResult.error.formErrors,
    } as const;
  }
  let cardStyleId: string;
  if (data.id) {
    const { id, ...updates } = data;
    await updateCardStyle(id, updates);
    cardStyleId = id;
  } else {
    const id = await createCardStyle(data);
    cardStyleId = id;
  }

  revalidatePath(`/cardStyles/[id]`);
  return { success: true, cardStyleId } as const;
};
