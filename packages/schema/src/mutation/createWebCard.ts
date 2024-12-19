import * as Sentry from '@sentry/nextjs';
import { GraphQLError } from 'graphql';
import { fromGlobalId } from 'graphql-relay';
import {
  createWebCard,
  getCompanyActivitiesByWebCardCategory,
  buildDefaultContactCard,
  createProfile,
  getWebCardByUserNameWithRedirection,
  transaction,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { isValidUserName } from '@azzapp/shared/stringHelpers';
import { getSessionInfos } from '#GraphQLContext';
import { profileLoader, userLoader, webCardCategoryLoader } from '#loaders';
import type { MutationResolvers } from '#/__generated__/types';

const createWebCardMutation: MutationResolvers['createWebCard'] = async (
  _,
  { input },
) => {
  const { userId } = getSessionInfos();
  if (!userId) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  const {
    userName,
    firstName,
    lastName,
    webCardCategoryId: graphqlWebCardCategoryId,
    companyActivityId: graphqlCompanyActivityId,
    companyName,
  } = input;

  const { id: webCardCategoryId, type } = fromGlobalId(
    graphqlWebCardCategoryId,
  );
  if (type !== 'WebCardCategory') {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }
  const webCardCategory = await webCardCategoryLoader.load(webCardCategoryId);
  if (!webCardCategory) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  let companyActivityId: string | null = null;
  if (graphqlCompanyActivityId) {
    const { id, type } = fromGlobalId(graphqlCompanyActivityId);
    if (type !== 'CompanyActivity') {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }
    companyActivityId = id;
    const webCardCategoryActivities =
      await getCompanyActivitiesByWebCardCategory(webCardCategoryId);
    if (
      !webCardCategoryActivities.find(
        ({ id: activityId }) => activityId === companyActivityId,
      )
    ) {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }
  }

  if (!isValidUserName(userName)) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  if (await getWebCardByUserNameWithRedirection(userName)) {
    throw new GraphQLError(ERRORS.USERNAME_ALREADY_EXISTS);
  }

  const user = await userLoader.load(userId);

  const inputWebCard = {
    userName,
    firstName: firstName ?? null,
    lastName: lastName ?? null,
    webCardKind: webCardCategory.webCardKind,
    webCardCategoryId,
    companyActivityId: companyActivityId ?? null,
    companyName: companyName ?? null,
    lastUserNameUpdate: new Date(),
    locale: user?.locale ?? null,
  };

  const contactCard = await buildDefaultContactCard(inputWebCard, userId);

  try {
    let profileId: string | null = null;

    await transaction(async () => {
      const webCardId = await createWebCard(inputWebCard);
      profileId = await createProfile({
        webCardId,
        userId,
        contactCard,
        lastContactCardUpdate: new Date(),
        inviteSent: true,
      });
    });

    if (!profileId) {
      throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
    }

    const profile = await profileLoader.load(profileId);

    if (!profile) {
      Sentry.captureMessage('Profile not found after creation');
      throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
    }
    return { profile };
  } catch (error) {
    Sentry.captureException(error);
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }
};

export default createWebCardMutation;
