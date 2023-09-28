import omit from 'lodash/omit';
import ERRORS from '@azzapp/shared/errors';
import {
  db,
  getCardModulesSortedByPosition,
  getCardModuleCount,
  createCardModules,
} from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const duplicateModule: MutationResolvers['duplicateModule'] = async (
  _,
  { input: { moduleIds } },
  { auth, loaders, cardUsernamesToRevalidate },
) => {
  const { profileId } = auth;
  if (!profileId) {
    throw new Error(ERRORS.UNAUTORIZED);
  }
  const modules = await getCardModulesSortedByPosition(moduleIds);
  if (modules.some(m => m.profileId !== profileId)) {
    throw new Error(ERRORS.INVALID_REQUEST);
  }

  const moduleCount = await getCardModuleCount(profileId);

  let createdModuleIds: string[] = [];
  try {
    await db.transaction(async trx => {
      createdModuleIds = await createCardModules(
        modules.map(
          (module, index) => ({
            ...omit(module, 'id'),
            position: moduleCount + index,
          }),
          trx,
        ),
      );
    });
  } catch (e) {
    console.error(e);
    throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
  }

  const profile = (await loaders.Profile.load(profileId))!;
  cardUsernamesToRevalidate.add(profile.userName);

  return {
    profile,
    createdModules: modules.map((module, index) => ({
      originalModuleId: module.id,
      newModuleId: createdModuleIds[index],
    })),
  };
};

export default duplicateModule;
