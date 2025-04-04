import { GraphQLError } from 'graphql';
import {
  updateWebCard,
  transaction,
  createRedirectWebCard,
  deleteRedirectionFromTo,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { isValidUserName } from '@azzapp/shared/stringHelpers';
import { invalidateWebCard, notifyWebCardUsers } from '#externals';
import { webCardLoader, webCardOwnerLoader } from '#loaders';
import { checkWebCardProfileEditorRight } from '#helpers/permissionsHelpers';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import { validateCurrentSubscription } from '#helpers/subscriptionHelpers';
import { isUserNameAvailable } from '#helpers/webCardHelpers';
import type { MutationResolvers } from '#/__generated__/types';
import type { WebCard } from '@azzapp/data';

const USERNAME_CHANGE_FREQUENCY_DAY = parseInt(
  process.env.USERNAME_CHANGE_FREQUENCY_DAY ?? '1',
  10,
);

const USERNAME_REDIRECTION_AVAILABILITY_DAY = parseInt(
  process.env.USERNAME_REDIRECTION_AVAILABILITY_DAY ?? '2',
  10,
);

const updateWebCardMutation: MutationResolvers['updateWebCard'] = async (
  _,
  { webCardId: gqlWebCardId, input: updates },
) => {
  const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');

  const profile = await checkWebCardProfileEditorRight(webCardId);

  const { ...profileUpdates } = updates;

  const webCard = await webCardLoader.load(webCardId);

  if (!webCard) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const partialWebCard: Partial<WebCard> = {
    ...profileUpdates,
    webCardKind: profileUpdates.webCardKind || webCard?.webCardKind,
  };

  const previousUserName = webCard.userName;

  if (profileUpdates.userName && profileUpdates.userName !== previousUserName) {
    if (!isValidUserName(profileUpdates.userName)) {
      throw new GraphQLError(ERRORS.INVALID_WEBCARD_USERNAME);
    }
    if (!(await isUserNameAvailable(profileUpdates.userName)).available) {
      throw new GraphQLError(ERRORS.USERNAME_ALREADY_EXISTS);
    }

    if (previousUserName) {
      // Get the current date and time
      const now = new Date();
      // Convert lastUpdate to a Date object
      const lastUpdateDate = new Date(webCard.lastUserNameUpdate);
      // Get the time MINIMUM_DAYS_BETWEEN_CHANGING_USERNAME days ago
      const nextChangeDate = new Date(lastUpdateDate);
      nextChangeDate.setDate(
        nextChangeDate.getDate() + USERNAME_CHANGE_FREQUENCY_DAY,
      );

      //user can change if it was never published nor updated
      if (
        webCard.alreadyPublished &&
        nextChangeDate > now &&
        previousUserName
      ) {
        throw new GraphQLError(ERRORS.USERNAME_CHANGE_NOT_ALLOWED_DELAY, {
          extensions: {
            alloweChangeUserNameDate: nextChangeDate,
          },
        });
      }

      partialWebCard.lastUserNameUpdate = now;
    }
  }

  if (profileUpdates.webCardKind) {
    const owner = await webCardOwnerLoader.load(webCardId);

    if (!owner) {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }
    await validateCurrentSubscription(owner.id, {
      webCardIsPublished: webCard.cardIsPublished,
      action: 'UPDATE_WEBCARD_KIND',
      webCardKind: profileUpdates.webCardKind,
    });
  }

  try {
    notifyWebCardUsers(webCard, profile.userId);

    await transaction(async () => {
      await updateWebCard(webCardId, partialWebCard);

      if (
        webCard.alreadyPublished &&
        previousUserName &&
        partialWebCard.userName
      ) {
        const expiresAt = new Date();
        expiresAt.setDate(
          expiresAt.getDate() + USERNAME_REDIRECTION_AVAILABILITY_DAY,
        );
        await createRedirectWebCard({
          fromUserName: previousUserName,
          toUserName: partialWebCard.userName,
          expiresAt,
        });

        await deleteRedirectionFromTo(
          partialWebCard.userName,
          previousUserName,
        );

        invalidateWebCard(previousUserName);
      }
    });

    webCardLoader.clear(webCardId);
    const result = await webCardLoader.load(webCardId);
    if (result?.userName) {
      invalidateWebCard(result.userName);
    }

    return {
      webCard: result,
      profile,
    };
  } catch (e) {
    console.error(e);
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }
};

export default updateWebCardMutation;
