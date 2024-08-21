'use server';

import { revalidatePath } from 'next/cache';
import {
  createCardStyle,
  saveLocalizationMessage,
  updateCardStyle,
  transaction,
} from '@azzapp/data';
import { DEFAULT_LOCALE, ENTITY_TARGET } from '@azzapp/i18n';
import { ADMIN } from '#roles';
import { currentUserHasRole } from '#helpers/roleHelpers';
import { cardStyleSchema } from './cardStyleSchema';
import type { CardStyle } from '@azzapp/data';

export const saveCardStyle = async (
  data: Partial<CardStyle & { label: string }>,
) => {
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
  const cardStyleId = data.id;
  const { label, ...updates } = validationResult.data;
  if (cardStyleId) {
    const id = cardStyleId;
    await transaction(async () => {
      await updateCardStyle(id, updates);
      await saveLocalizationMessage({
        key: id,
        value: label,
        locale: DEFAULT_LOCALE,
        target: ENTITY_TARGET,
      });
    });
  } else {
    await transaction(async () => {
      const id = await createCardStyle(validationResult.data);
      await saveLocalizationMessage({
        key: id,
        value: label,
        locale: DEFAULT_LOCALE,
        target: ENTITY_TARGET,
      });
    });
  }

  revalidatePath(`/cardStyles/[id]`);
  return { success: true, cardStyleId } as const;
};
