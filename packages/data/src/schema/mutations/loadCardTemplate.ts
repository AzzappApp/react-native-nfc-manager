import { inArray } from 'drizzle-orm';
import { GraphQLError } from 'graphql';
import { fromGlobalId } from 'graphql-relay';
import { omit } from 'lodash';
import { DEFAULT_CARD_STYLE } from '@azzapp/shared/cardHelpers';
import ERRORS from '@azzapp/shared/errors';
import {
  CardModuleTable,
  db,
  getCardModules,
  getCardStyleById,
  getCardTemplateById,
  referencesMedias,
  updateProfile,
} from '#domains';
import { MODULES_SAVE_RULES } from './ModulesMutationsResolvers';
import type { MutationResolvers } from '#schema/__generated__/types';

const loadCardTemplateMutation: MutationResolvers['loadCardTemplate'] = async (
  _,
  { input: { cardTemplateId } },
  { auth, loaders, cardUsernamesToRevalidate },
) => {
  const { profileId } = auth;
  if (!profileId) {
    throw new GraphQLError(ERRORS.UNAUTORIZED);
  }
  const profile = await loaders.Profile.load(profileId);
  if (!profile) {
    throw new GraphQLError(ERRORS.UNAUTORIZED);
  }

  const { type, id } = fromGlobalId(cardTemplateId);
  if (type !== 'CardTemplate') {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }
  const cardTemplate = await getCardTemplateById(id);
  if (!cardTemplate) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const cardStyle =
    (await getCardStyleById(cardTemplate.cardStyleId)) ?? DEFAULT_CARD_STYLE;

  try {
    await db.transaction(async trx => {
      const currentModules = await getCardModules(profileId, true, trx);
      const currentMedias = currentModules.flatMap(m => {
        const saveRules = MODULES_SAVE_RULES[m.kind];
        if (saveRules && 'getMedias' in saveRules) {
          return saveRules.getMedias?.(m.data as any) ?? [];
        }
        return [];
      });

      const newMedias = cardTemplate.modules.flatMap(m => {
        const saveRules = MODULES_SAVE_RULES[m.kind];
        if (saveRules && 'getMedias' in saveRules) {
          return saveRules.getMedias?.(m.data as any) ?? [];
        }
        return [];
      });

      await referencesMedias(newMedias, currentMedias, trx);

      if (currentModules.length > 0) {
        await trx.delete(CardModuleTable).where(
          inArray(
            CardModuleTable.id,
            currentModules.map(m => m.id),
          ),
        );
      }

      await trx.insert(CardModuleTable).values(
        cardTemplate.modules.map(({ kind, data }, index) => ({
          kind,
          data,
          profileId,
          position: index,
        })),
      );

      const profileUpdates = {
        cardStyle: omit(cardStyle, 'id', 'labels', 'enabled'),
        updatedAt: new Date(),
        lastCardUpdate: new Date(),
        lastContactCardUpdate: new Date(),
      };
      await updateProfile(profileId, profileUpdates, trx);
    });
  } catch (e) {
    console.error(e);
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }

  cardUsernamesToRevalidate.add(profile.userName);
  return { profile };
};

export default loadCardTemplateMutation;
