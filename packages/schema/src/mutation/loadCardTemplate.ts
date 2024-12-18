import { GraphQLError } from 'graphql';
import omit from 'lodash/omit';
import {
  createCardModules,
  getCardModulesByWebCard,
  getCardStyleById,
  getCardTemplateById,
  referencesMedias,
  removeCardModules,
  transaction,
  updateWebCard,
} from '@azzapp/data';
import { DEFAULT_CARD_STYLE } from '@azzapp/shared/cardHelpers';
import ERRORS from '@azzapp/shared/errors';
import { profileHasEditorRight } from '@azzapp/shared/profileHelpers';
import { invalidateWebCard } from '#externals';
import { getSessionInfos } from '#GraphQLContext';
import { profileByWebCardIdAndUserIdLoader, webCardLoader } from '#loaders';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import { checkWebCardHasSubscription } from '#helpers/subscriptionHelpers';
import { MODULES_SAVE_RULES } from './ModulesMutationsResolvers';
import type { MutationResolvers } from '#/__generated__/types';

const loadCardTemplateMutation: MutationResolvers['loadCardTemplate'] = async (
  _,
  { cardTemplateId: gqlCardTemplateID, webCardId: gqlWebCardId },
) => {
  const { userId } = getSessionInfos();
  if (!userId) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }
  const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');
  const profile = await profileByWebCardIdAndUserIdLoader.load({
    userId,
    webCardId,
  });

  if (!profile) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }
  if (!profileHasEditorRight(profile.profileRole)) {
    throw new GraphQLError(ERRORS.FORBIDDEN, {
      extensions: {
        role: profile.profileRole,
      },
    });
  }

  const cardTemplateId = fromGlobalIdWithType(
    gqlCardTemplateID,
    'CardTemplate',
  );
  const cardTemplate = await getCardTemplateById(cardTemplateId);
  if (!cardTemplate) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const webCard = await webCardLoader.load(profile.webCardId);

  if (!webCard) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  await checkWebCardHasSubscription({
    webCard,
    appliedModules: cardTemplate.modules,
  });

  const cardStyle =
    (await getCardStyleById(cardTemplate.cardStyleId)) ?? DEFAULT_CARD_STYLE;

  try {
    await transaction(async () => {
      const currentModules = await getCardModulesByWebCard(
        profile.webCardId,
        true,
      );

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

      await referencesMedias(newMedias, currentMedias);

      if (currentModules.length > 0) {
        await removeCardModules(currentModules.map(m => m.id));
      }

      await createCardModules(
        cardTemplate.modules.map(({ kind, data }, index) => ({
          kind,
          data,
          webCardId: profile.webCardId,
          position: index,
        })),
      );

      await updateWebCard(profile.webCardId, {
        cardStyle: omit(cardStyle, 'id', 'labels', 'enabled'),
        updatedAt: new Date(),
        lastCardUpdate: new Date(),
      });
    });
  } catch (e) {
    console.error(e);
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }

  webCardLoader.clear(profile.webCardId);

  const webCardAfterUpdate = await webCardLoader.load(profile.webCardId);
  if (!webCardAfterUpdate) {
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }

  invalidateWebCard(webCard.userName);
  return { webCard: webCardAfterUpdate };
};

export default loadCardTemplateMutation;
