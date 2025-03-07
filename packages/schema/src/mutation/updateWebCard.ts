import { GraphQLError } from 'graphql';
import { updateWebCard } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { profileHasAdminRight } from '@azzapp/shared/profileHelpers';
import { isValidUserName } from '@azzapp/shared/stringHelpers';
import { getSessionInfos } from '#GraphQLContext';
import {
  profileByWebCardIdAndUserIdLoader,
  webCardCategoryLoader,
  webCardLoader,
} from '#loaders';
import { checkWebCardProfileEditorRight } from '#helpers/permissionsHelpers';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import { checkWebCardHasSubscription } from '#helpers/subscriptionHelpers';
import { isUserNameAvailable } from '#helpers/webCardHelpers';
import type { MutationResolvers } from '#/__generated__/types';
import type { WebCard } from '@azzapp/data';

const updateWebCardMutation: MutationResolvers['updateWebCard'] = async (
  _,
  { webCardId: gqlWebCardId, input: updates },
) => {
  const { userId } = getSessionInfos();
  const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');

  await checkWebCardProfileEditorRight(webCardId);

  const {
    webCardCategoryId: graphqlWebCardCategoryId,
    companyActivityId: graphqlCompanyActivityId,
    ...profileUpdates
  } = updates;

  const webCard = await webCardLoader.load(webCardId);

  if (!webCard) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  if (profileUpdates.userName && profileUpdates.userName !== webCard.userName) {
    if (webCard.userName) {
      // we must use updateWebCardUserName mutation to change the username / here we only accept filling empty username
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }

    if (!isValidUserName(profileUpdates.userName)) {
      throw new GraphQLError(ERRORS.INVALID_WEBCARD_USERNAME);
    }
    if (!(await isUserNameAvailable(profileUpdates.userName)).available) {
      throw new GraphQLError(ERRORS.USERNAME_ALREADY_EXISTS);
    }
  }

  const partialWebCard: Partial<WebCard> = {
    ...profileUpdates,
    webCardKind: profileUpdates.webCardKind || webCard?.webCardKind,
  };

  if (graphqlWebCardCategoryId) {
    const webCardCategoryId = fromGlobalIdWithType(
      graphqlWebCardCategoryId,
      'WebCardCategory',
    );
    partialWebCard.webCardCategoryId = webCardCategoryId;
    if (webCardCategoryId !== webCard.webCardCategoryId) {
      partialWebCard.companyActivityId = undefined;
    }

    const webCardCategory = await webCardCategoryLoader.load(webCardCategoryId);

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
    if (!profile || profile.invited) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
    }
    if (!profileHasAdminRight(profile.profileRole)) {
      throw new GraphQLError(ERRORS.FORBIDDEN, {
        extensions: {
          role: profile.profileRole,
        },
      });
    }
  }
  try {
    await updateWebCard(webCardId, partialWebCard);

    webCardLoader.clear(webCardId);
    const result = await webCardLoader.load(webCardId);

    return {
      webCard: result,
    };
  } catch {
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }
};

export default updateWebCardMutation;
