import { GraphQLError } from 'graphql';
import {
  checkMedias,
  createProfile,
  createWebCard,
  getWebCardByUserNameWithRedirection,
  getPublishedWebCardCount,
  pickRandomPredefinedCover,
  referencesMedias,
  transaction,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { isDefined } from '@azzapp/shared/isDefined';
import { isValidUserName } from '@azzapp/shared/stringHelpers';
import { getSessionInfos } from '#GraphQLContext';
import { profileLoader, userLoader } from '#loaders';
import { validateCurrentSubscription } from '#helpers/subscriptionHelpers';
import type { MutationResolvers } from '#/__generated__/types';
import type { WebCardTable } from '@azzapp/data/src/schema';
import type { WebCardKind } from '@azzapp/shared/webCardKind';
import type { InferInsertModel } from 'drizzle-orm';

const createContactCard: MutationResolvers['createContactCard'] = async (
  _,
  { webCardKind, contactCard, webCardUserName, primaryColor, coverMediaId },
) => {
  const { userId } = getSessionInfos();

  if (!userId) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  const user = await userLoader.load(userId);
  let defaultCover = null;

  //w don't need a default cover if we got a coverMediId
  if (!coverMediaId) {
    defaultCover = await pickRandomPredefinedCover();
  }

  const currentDate = new Date();

  if (webCardUserName) {
    if (!isValidUserName(webCardUserName)) {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }

    if (await getWebCardByUserNameWithRedirection(webCardUserName)) {
      throw new GraphQLError(ERRORS.USERNAME_ALREADY_EXISTS);
    }
  }

  await validateCurrentSubscription(userId, {
    webCardKind,
    action: 'CREATE_CONTACT_CARD',
    alreadyPublished: await getPublishedWebCardCount(userId),
    webCardIsPublished: true,
    contactCardHasCompanyName: !!contactCard.company,
    contactCardHasUrl: !!contactCard.urls?.length,
  });

  const inputWebCard: InferInsertModel<typeof WebCardTable> = {
    firstName: contactCard.firstName,
    lastName: contactCard.lastName ?? null,
    webCardKind: webCardKind as WebCardKind,
    companyName: contactCard.company,
    lastUserNameUpdate: currentDate,
    locale: user?.locale ?? null,
    cardColors: defaultCover
      ? { ...defaultCover.defaultTriptychColors, otherColors: [] }
      : primaryColor
        ? {
            primary: primaryColor,
            dark: '#0E1216',
            light: '#FFFFFF',
            otherColors: [],
          }
        : undefined,
    coverIsPredefined: !coverMediaId,
    coverIsLogoPredefined: !!coverMediaId,
    cardIsPublished: true,
    coverMediaId: coverMediaId ?? defaultCover?.mediaId,
    companyActivityLabel: contactCard.companyActivityLabel,
    alreadyPublished: true,
    userName: webCardUserName,
  };

  try {
    const addedMedia = [
      coverMediaId ?? defaultCover?.mediaId,
      contactCard.avatarId,
      contactCard.logoId,
    ].filter(isDefined);

    if (addedMedia.length) {
      await checkMedias(addedMedia);
      await referencesMedias(addedMedia, null);
    }

    const profileId = await transaction(async () => {
      const webCardId = await createWebCard(inputWebCard);
      const id = await createProfile({
        webCardId,
        userId,
        contactCard,
        lastContactCardUpdate: new Date(
          currentDate.setMinutes(currentDate.getMinutes() + 1),
        ), // Will hide finger hint after creation
        inviteSent: true,
        avatarId: contactCard.avatarId,
        logoId: contactCard.logoId,
      });
      return id;
    });

    if (!profileId) {
      throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
    }
    const profile = await profileLoader.load(profileId);

    if (!profile) {
      throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
    }
    return { profile };
  } catch {
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }
};

export default createContactCard;
