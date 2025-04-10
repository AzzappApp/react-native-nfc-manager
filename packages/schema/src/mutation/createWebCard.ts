import * as Sentry from '@sentry/nextjs';
import { GraphQLError } from 'graphql';
import { fromGlobalId } from 'graphql-relay';
import {
  createWebCard,
  buildDefaultContactCard,
  createProfile,
  getWebCardByUserNameWithRedirection,
  transaction,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { isValidUserName } from '@azzapp/shared/stringHelpers';
import { getSessionInfos } from '#GraphQLContext';
import { userLoader, webCardCategoryLoader } from '#loaders';
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
    companyName: companyName ?? null,
    lastUserNameUpdate: new Date(),
    locale: user?.locale ?? null,
  };

  const contactCard = await buildDefaultContactCard(inputWebCard, userId);

  try {
    const profile = await transaction(async () => {
      const webCardId = await createWebCard(inputWebCard);
      const currentDate = new Date();
      const profileData = {
        webCardId,
        userId,
        contactCard,
        lastContactCardUpdate: currentDate,
        inviteSent: true,
      };
      const profileId = await createProfile(profileData);
      return {
        id: profileId,
        ...profileData,
        profileRole: 'owner',
        invited: false,
        invitedBy: null,
        promotedAsOwner: false,
        avatarId: null,
        logoId: null,
        contactCardIsPrivate: true,
        contactCardDisplayedOnWebCard: false,
        createdAt: currentDate,
        nbContactCardScans: 0,
        nbShareBacks: 0,
        deleted: false,
        deletedAt: null,
        deletedBy: null,
        lastContactViewAt: currentDate,
        hasGooglePass: false,
      } as const;
    });

    return { profile };
  } catch (error) {
    Sentry.captureException(error);
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }
};

export default createWebCardMutation;
