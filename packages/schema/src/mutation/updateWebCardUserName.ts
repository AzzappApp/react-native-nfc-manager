import { GraphQLError } from 'graphql';
import {
  updateWebCard,
  transaction,
  createRedirectWebCard,
  deleteRedirectionFromTo,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { isValidUserName } from '@azzapp/shared/stringHelpers';
import { invalidateWebCard } from '#externals';
import { webCardLoader } from '#loaders';
import { checkWebCardProfileAdminRight } from '#helpers/permissionsHelpers';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import { isUserNameAvailable } from '#helpers/webCardHelpers';
import type { MutationResolvers } from '#/__generated__/types';

const USERNAME_CHANGE_FREQUENCY_DAY = parseInt(
  process.env.USERNAME_CHANGE_FREQUENCY_DAY ?? '1',
  10,
);

const USERNAME_REDIRECTION_AVAILABILITY_DAY = parseInt(
  process.env.USERNAME_REDIRECTION_AVAILABILITY_DAY ?? '2',
  10,
);

const updateWebCardUserNameMutation: MutationResolvers['updateWebCardUserName'] =
  async (_, { webCardId: gqlWebCardId, input: { userName } }) => {
    const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');

    if (!isValidUserName(userName)) {
      throw new GraphQLError(ERRORS.INVALID_WEBCARD_USERNAME);
    }

    await checkWebCardProfileAdminRight(webCardId);

    const webCard = await webCardLoader.load(webCardId);

    if (!webCard) {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }

    const previousUserName = webCard.userName;

    //avoid having the same value
    if (previousUserName === userName) {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }

    if (!(await isUserNameAvailable(userName)).available) {
      throw new GraphQLError(ERRORS.USERNAME_ALREADY_EXISTS);
    }

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
    if (webCard.alreadyPublished && nextChangeDate > now && previousUserName) {
      throw new GraphQLError(ERRORS.USERNAME_CHANGE_NOT_ALLOWED_DELAY, {
        extensions: {
          alloweChangeUserNameDate: nextChangeDate,
        },
      });
    }

    const expiresAt = new Date();
    expiresAt.setDate(
      expiresAt.getDate() + USERNAME_REDIRECTION_AVAILABILITY_DAY,
    );

    try {
      await transaction(async () => {
        await updateWebCard(webCard.id, { userName, lastUserNameUpdate: now });
        if (webCard.alreadyPublished && previousUserName) {
          await createRedirectWebCard({
            fromUserName: previousUserName,
            toUserName: userName,
            expiresAt,
          });

          await deleteRedirectionFromTo(userName, previousUserName);
        }
      });
    } catch (error) {
      console.log(error);
      throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
    }
    if (previousUserName) {
      invalidateWebCard(previousUserName);
    }
    invalidateWebCard(userName);
    return {
      webCard: { ...webCard, userName, lastUserNameUpdate: now },
    };
  };

export default updateWebCardUserNameMutation;
