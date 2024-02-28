import { sql, and, gt, eq, notInArray } from 'drizzle-orm';
import { GraphQLError } from 'graphql';
import omit from 'lodash/omit';
import ERRORS from '@azzapp/shared/errors';
import {
  db,
  getCardModulesSortedByPosition,
  createCardModules,
  CardModuleTable,
} from '#domains';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#schema/__generated__/types';

const duplicateModule: MutationResolvers['duplicateModule'] = async (
  _,
  { webCardId: gqlWebCardId, input: { modulesIds } },
  { cardUsernamesToRevalidate, loaders },
) => {
  const modules = await getCardModulesSortedByPosition(modulesIds);
  if (modulesIds.length === 0) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');
  if (
    !modules.every(module => module != null && module.webCardId === webCardId)
  ) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  let createdModuleIds: string[] = [];
  try {
    await db.transaction(async trx => {
      createdModuleIds = await createCardModules(
        modules.map(
          (module, index) => ({
            ...omit(module, 'id'),
            position: modules[modules.length - 1].position + index + 1,
          }),
          trx,
        ),
      );

      await trx
        .update(CardModuleTable)
        .set({
          position: sql`${CardModuleTable.position} + ${modules.length}`,
        })
        .where(
          and(
            gt(CardModuleTable.position, modules[modules.length - 1].position),
            eq(CardModuleTable.webCardId, webCardId),
            notInArray(CardModuleTable.id, createdModuleIds),
          ),
        );
    });
  } catch (e) {
    console.error(e);
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }

  const webCard = await loaders.WebCard.load(webCardId);

  if (webCard) {
    cardUsernamesToRevalidate.add(webCard.userName);
  }

  return {
    createdModules: modules.map((module, index) => ({
      originalModuleId: module.id,
      newModuleId: createdModuleIds[index],
    })),
  };
};

export default duplicateModule;
