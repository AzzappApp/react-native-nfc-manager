/* eslint-disable @typescript-eslint/ban-ts-comment */
import { GraphQLError } from 'graphql';
import { fromGlobalId } from 'graphql-relay';
import ERRORS from '@azzapp/shared/errors';
import { isValidUserName } from '@azzapp/shared/stringHelpers';
import {
  createWebCard,
  db,
  getCompanyActivitiesByWebCardCategory,
  getWebCardCategoryById,
  getWebCardByUserName,
  buildDefaultContactCard,
  createProfile,
} from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';
import type { GraphQLContext } from '../GraphQLContext';

const createWebCardMutation: MutationResolvers['createWebCard'] = async (
  _,
  { input },
  { auth, loaders }: GraphQLContext,
) => {
  const { userId } = auth;
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
  const webCardCategory = await getWebCardCategoryById(webCardCategoryId);
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

  if (await getWebCardByUserName(userName)) {
    throw new Error(ERRORS.USERNAME_ALREADY_EXISTS);
  }

  const inputWebCard = {
    userName,
    firstName: firstName ?? null,
    lastName: lastName ?? null,
    webCardKind: webCardCategory.webCardKind,
    webCardCategoryId,
    companyActivityId: companyActivityId ?? null,
    companyName: companyName ?? null,
  };

  const contactCard = await buildDefaultContactCard(inputWebCard, userId);

  try {
    let profileId: string | null = null;

    await db.transaction(async trx => {
      const webCardId = await createWebCard({ ...inputWebCard }, trx);
      profileId = await createProfile(
        {
          webCardId,
          userId,
          contactCard,
          lastContactCardUpdate: new Date(),
        },
        trx,
      );
    });

    if (!profileId) {
      throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
    }

    const profile = await loaders.Profile.load(profileId);

    if (!profile) {
      throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
    }
    return { profile };
  } catch (error) {
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }
};

export default createWebCardMutation;
