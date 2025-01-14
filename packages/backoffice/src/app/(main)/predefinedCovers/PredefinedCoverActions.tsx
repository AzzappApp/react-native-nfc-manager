'use server';
import {
  transaction,
  createPredefinedCover,
  deletePredefinedCover as deletePredefinedCoverQuery,
  updatePredefinedCover,
  referencesMedias,
} from '@azzapp/data';
import { ADMIN } from '#roles';
import { currentUserHasRole } from '#helpers/roleHelpers';
import { predefinedCoverSchema } from './predefinedCoverSchema';

export const deletePredefinedCover = async (id: string) => {
  if (!(await currentUserHasRole(ADMIN))) {
    throw new Error('Unauthorized');
  }

  await transaction(async () => {
    await deletePredefinedCoverQuery(id);
    await referencesMedias([], [id]);
  });
};

export const savePredefinedCover = async (data: {
  id?: string;
  mediaId?: string;
  primary?: string;
  light?: string;
  dark?: string;
}): Promise<{
  success: boolean;
  formErrors?: any;
  message?: string;
  predefinedCoverId?: string;
}> => {
  if (!(await currentUserHasRole(ADMIN))) {
    throw new Error('Unauthorized');
  }
  const validationResult = predefinedCoverSchema.safeParse({
    mediaId: data.mediaId,
    primary: data.primary,
    light: data.primary,
    dark: data.dark,
  });
  if (!validationResult.success) {
    return {
      success: false,
      formErrors: validationResult.error.formErrors,
    } as const;
  }
  try {
    let predefinedCoverId;
    const transactionResult = await transaction(async () => {
      if (!data.mediaId) {
        return {
          success: false,
          formErrors: 'provide a media',
        } as const;
      }
      if (!data.dark || !data.light || !data.primary) {
        return {
          success: false,
          formErrors: 'provide a correct dark color',
        } as const;
      }
      const serverData = {
        mediaId: data.mediaId,
        defaultTriptychColors: {
          primary: data.primary,
          light: data.light,
          dark: data.dark,
        },
      };
      if (data.id) {
        predefinedCoverId = await updatePredefinedCover(data.id, serverData);
      } else {
        predefinedCoverId = await createPredefinedCover(serverData);
        await referencesMedias([predefinedCoverId], null);
      }
    });
    if (transactionResult) return transactionResult;
    return { success: true, predefinedCoverId } as const;
  } catch (e: any) {
    return {
      success: false,
      message: e.message || 'Error while saving profile category',
    };
  }
};
