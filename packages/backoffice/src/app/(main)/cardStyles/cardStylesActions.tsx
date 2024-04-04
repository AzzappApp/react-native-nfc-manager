'use server';

import { revalidatePath } from 'next/cache';
import {
  createCardStyle,
  createLabel,
  db,
  updateCardStyle,
} from '@azzapp/data';
import { ADMIN } from '#roles';
import { saveLabelKey } from '#helpers/lokaliseHelperts';
import { currentUserHasRole } from '#helpers/roleHelpers';
import { cardStyleSchema } from './cardStyleSchema';
import type { CardStyle, Label } from '@azzapp/data';

export const saveCardStyle = async (data: Partial<CardStyle & Label>) => {
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
  let cardStyleId = data.id;
  if (cardStyleId) {
    const id = cardStyleId;
    const { baseLabelValue, ...updates } = validationResult.data;
    await db.transaction(async trx => {
      await updateCardStyle(id, updates, trx);
      await createLabel(
        { labelKey: updates.labelKey, baseLabelValue, translations: {} },
        trx,
      );

      await saveLabelKey({
        labelKey: validationResult.data.labelKey,
        baseLabelValue: validationResult.data.baseLabelValue,
      });
    });
  } else {
    await db.transaction(async trx => {
      const id = await createCardStyle(validationResult.data, trx);
      await createLabel(
        {
          labelKey: validationResult.data.labelKey,
          baseLabelValue: validationResult.data.baseLabelValue,
          translations: {},
        },
        trx,
      );
      cardStyleId = id;

      await saveLabelKey({
        labelKey: validationResult.data.labelKey,
        baseLabelValue: validationResult.data.baseLabelValue,
      });
    });
  }

  revalidatePath(`/cardStyles/[id]`);
  return { success: true, cardStyleId } as const;
};
