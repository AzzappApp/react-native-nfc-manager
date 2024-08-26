/* eslint-disable @typescript-eslint/ban-ts-comment */
import { GraphQLError } from 'graphql';
import { updateWebCard, type WebCard } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { profileHasAdminRight } from '@azzapp/shared/profileHelpers';
import { getSessionInfos } from '#GraphQLContext';
import {
  profileByWebCardIdAndUserIdLoader,
  webCardCategoryLoader,
  webCardLoader,
} from '#loaders';
import { hasWebCardProfileEditorRight } from '#helpers/permissionsHelpers';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import { checkWebCardHasSubscription } from '#helpers/subscriptionHelpers';
import type { MutationResolvers } from '#/__generated__/types';

const updateWebCardMutation: MutationResolvers['updateWebCard'] = async (
  _,
  { webCardId: gqlWebCardId, input: updates },
) => {
  const { userId } = getSessionInfos();
  const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');

  if (!(await hasWebCardProfileEditorRight(webCardId))) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  const {
    webCardCategoryId: graphqlWebCardCategoryId,
    companyActivityId: graphqlCompanyActivityId,
    ...profileUpdates
  } = updates;

  const partialWebCard: Partial<WebCard> = {
    ...profileUpdates,
  };

  const webCard = await webCardLoader.load(webCardId);

  if (!webCard) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  try {
    if (graphqlWebCardCategoryId) {
      const webCardCategoryId = fromGlobalIdWithType(
        graphqlWebCardCategoryId,
        'WebCardCategory',
      );
      partialWebCard.webCardCategoryId = webCardCategoryId;
      if (webCardCategoryId !== webCard.webCardCategoryId) {
        partialWebCard.companyActivityId = undefined;
      }

      const webCardCategory =
        await webCardCategoryLoader.load(webCardCategoryId);

      partialWebCard.webCardKind = webCardCategory?.webCardKind;
    }
    if (graphqlCompanyActivityId) {
      const companyActivityId = fromGlobalIdWithType(
        graphqlCompanyActivityId,
        'CompanyActivity',
      );
      partialWebCard.companyActivityId = companyActivityId;
    } else if (graphqlCompanyActivityId === null) {
      partialWebCard.companyActivityId = null;
    }

    await checkWebCardHasSubscription({
      webCard: {
        ...webCard,
        ...Object.fromEntries(
          Object.entries(partialWebCard).filter(
            ([_entry, value]) => value !== undefined,
          ),
        ),
      },
    });

    if (webCard.companyActivityId !== partialWebCard.companyActivityId) {
      const profile =
        userId &&
        (await profileByWebCardIdAndUserIdLoader.load({ userId, webCardId }));
      if (
        !profile ||
        !profileHasAdminRight(profile.profileRole) ||
        profile.invited
      ) {
        throw new GraphQLError(ERRORS.UNAUTHORIZED);
      }
    }

    await updateWebCard(webCardId, partialWebCard);

    webCardLoader.clear(webCardId);
    const result = await webCardLoader.load(webCardId);

    return {
      webCard: result,
    };
  } catch (error) {
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }
};

export default updateWebCardMutation;
