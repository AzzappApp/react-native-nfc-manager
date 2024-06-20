import { inArray } from 'drizzle-orm';
import { GraphQLError } from 'graphql';
import { omit } from 'lodash';
import {
  CardModuleTable,
  db,
  getCardModules,
  getCardStyleById,
  getCardTemplateById,
  referencesMedias,
  updateProfile,
  updateWebCard,
} from '@azzapp/data';
import { DEFAULT_CARD_STYLE } from '@azzapp/shared/cardHelpers';
import ERRORS from '@azzapp/shared/errors';
import { webCardRequiresSubscription } from '@azzapp/shared/subscriptionHelpers';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import { MODULES_SAVE_RULES } from './ModulesMutationsResolvers';
import type { MutationResolvers } from '#/__generated__/types';

const loadCardTemplateMutation: MutationResolvers['loadCardTemplate'] = async (
  _,
  { cardTemplateId: gqlCardTemplateID, webCardId: gqlWebCardId },
  { auth, cardUsernamesToRevalidate, loaders },
) => {
  const { userId } = auth;
  const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');
  const profile =
    userId &&
    (await loaders.profileByWebCardIdAndUserId.load({ userId, webCardId }));

  if (!profile) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  const cardTemplateId = fromGlobalIdWithType(
    gqlCardTemplateID,
    'CardTemplate',
  );
  const cardTemplate = await getCardTemplateById(cardTemplateId);
  if (!cardTemplate) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const webCard = await loaders.WebCard.load(profile.webCardId);

  if (!webCard) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const owner = await loaders.webCardOwners.load(webCard.id);

  if (
    webCard.cardIsPublished &&
    webCardRequiresSubscription(cardTemplate.modules, webCard.webCardKind)
  ) {
    const subscription = owner
      ? await loaders.activeSubscriptionsLoader.load(owner.id)
      : [];
    if (subscription.length === 0) {
      throw new GraphQLError(ERRORS.SUBSCRIPTION_REQUIRED);
    }
  }

  const cardStyle =
    (await getCardStyleById(cardTemplate.cardStyleId)) ?? DEFAULT_CARD_STYLE;

  try {
    await db.transaction(async trx => {
      const currentModules = await getCardModules(profile.webCardId, true, trx);

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
          webCardId: profile.webCardId,
          position: index,
        })),
      );

      const webCardUpdates = {
        cardStyle: omit(cardStyle, 'id', 'labels', 'enabled'),
        updatedAt: new Date(),
        lastCardUpdate: new Date(),
      };

      const userProfileUpdates = {
        lastContactCardUpdate: new Date(),
      };

      await updateWebCard(profile.webCardId, webCardUpdates, trx);
      await updateProfile(profile.id, userProfileUpdates, trx);
    });
  } catch (e) {
    console.error(e);
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }

  loaders.WebCard.clear(profile.webCardId);

  const webCardAfterUpdate = await loaders.WebCard.load(profile.webCardId);
  if (!webCardAfterUpdate) {
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }

  cardUsernamesToRevalidate.add(webCard.userName);
  return { webCard: webCardAfterUpdate };
};

export default loadCardTemplateMutation;
