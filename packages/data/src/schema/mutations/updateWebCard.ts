/* eslint-disable @typescript-eslint/ban-ts-comment */
import { GraphQLError } from 'graphql';
import ERRORS from '@azzapp/shared/errors';
import { isAdmin, isEditor } from '@azzapp/shared/profileHelpers';
import {
  updateWebCard,
  type WebCard,
  getUserProfileWithWebCardId,
} from '#domains';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#schema/__generated__/types';
import type { GraphQLContext } from '../GraphQLContext';

const updateWebCardMutation: MutationResolvers['updateWebCard'] = async (
  _,
  { input: { webCardId: gqlWebCardId, ...updates } },
  { auth, loaders }: GraphQLContext,
) => {
  const { userId } = auth;
  const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');
  const profile =
    userId && (await getUserProfileWithWebCardId(userId, webCardId));

  if (!profile || !isEditor(profile.profileRole) || profile.invited) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  const {
    webCardCategoryId: graphqlWebCardCategoryId,
    companyActivityId: graphqlCompanyActivityId,
    ...profileUpdates
  } = updates;

  const partialWebCard: Partial<
    Omit<WebCard, 'createdAt' | 'id' | 'updatedAt' | 'webCardKind'>
  > = {
    ...profileUpdates,
  };

  try {
    const webCard = await loaders.WebCard.load(profile.webCardId);

    if (!webCard) {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }

    if (graphqlWebCardCategoryId) {
      const webCardCategoryId = fromGlobalIdWithType(
        graphqlWebCardCategoryId,
        'WebCardCategory',
      );
      partialWebCard.webCardCategoryId = webCardCategoryId;
      if (webCardCategoryId !== webCard.webCardCategoryId) {
        partialWebCard.companyActivityId = undefined;
      }
    }
    if (graphqlCompanyActivityId) {
      const companyActivityId = fromGlobalIdWithType(
        graphqlCompanyActivityId,
        'CompanyActivity',
      );
      partialWebCard.companyActivityId = companyActivityId;
    }

    if (
      webCard.companyActivityId !== partialWebCard.companyActivityId &&
      (!isAdmin(profile.profileRole) || profile.invited)
    ) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
    }

    await updateWebCard(profile.webCardId, partialWebCard);

    return {
      webCard: { ...webCard, ...partialWebCard },
    };
  } catch (error) {
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }
};

export default updateWebCardMutation;
