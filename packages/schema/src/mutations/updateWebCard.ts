/* eslint-disable @typescript-eslint/ban-ts-comment */
import { GraphQLError } from 'graphql';
import { updateWebCard, type WebCard } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { isAdmin } from '@azzapp/shared/profileHelpers';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import { checkWebCardHasSubscription } from '#use-cases/subscription';
import type { MutationResolvers } from '#/__generated__/types';
import type { GraphQLContext } from '#/GraphQLContext';

const updateWebCardMutation: MutationResolvers['updateWebCard'] = async (
  _,
  { webCardId: gqlWebCardId, input: updates },
  { auth, loaders }: GraphQLContext,
) => {
  const { userId } = auth;
  const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');

  const {
    webCardCategoryId: graphqlWebCardCategoryId,
    companyActivityId: graphqlCompanyActivityId,
    ...profileUpdates
  } = updates;

  const partialWebCard: Partial<WebCard> = {
    ...profileUpdates,
  };

  const webCard = await loaders.WebCard.load(webCardId);

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
        await loaders.WebCardCategory.load(webCardCategoryId);

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

    await checkWebCardHasSubscription(
      {
        webCard: {
          ...webCard,
          ...Object.fromEntries(
            Object.entries(partialWebCard).filter(
              ([_entry, value]) => value !== undefined,
            ),
          ),
        },
      },
      loaders,
    );

    if (webCard.companyActivityId !== partialWebCard.companyActivityId) {
      const profile =
        userId &&
        (await loaders.profileByWebCardIdAndUserId.load({ userId, webCardId }));
      if (!profile || !isAdmin(profile.profileRole) || profile.invited) {
        throw new GraphQLError(ERRORS.UNAUTHORIZED);
      }
    }

    await updateWebCard(webCardId, partialWebCard);

    loaders.WebCard.clear(webCardId);
    const result = await loaders.WebCard.load(webCardId);

    return {
      webCard: result,
    };
  } catch (error) {
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }
};

export default updateWebCardMutation;
