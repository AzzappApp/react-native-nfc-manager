'use server';

import { revalidatePath } from 'next/cache';
import {
  saveLocalizationMessage,
  type LocalizationMessage,
} from '@azzapp/data';
import { TRANSLATOR, ADMIN } from '#roles';
import { currentUserHasRole } from '#helpers/roleHelpers';

export const saveTranslationMessage = async (message: LocalizationMessage) => {
  if (
    !(await currentUserHasRole(TRANSLATOR)) &&
    !(await currentUserHasRole(ADMIN))
  ) {
    throw new Error('Unauthorized');
  }
  await saveLocalizationMessage(message);
  revalidatePath('/translations');
  revalidatePath(`/translations/${message.locale}`);
};
