/* eslint-disable @typescript-eslint/ban-ts-comment */
import { GraphQLError } from 'graphql';
import {
  updateWebCard,
  transaction,
  createRedirectWebCard,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { isValidUserName } from '@azzapp/shared/stringHelpers';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#/__generated__/types';
import type { GraphQLContext } from '#/GraphQLContext';

const USERNAME_CHANGE_FREQUENCY_DAY = parseInt(
  process.env.USERNAME_CHANGE_FREQUENCY_DAY ?? '1',
  10,
);

const USERNAME_REDIRECTION_AVAILABILITY_DAY = parseInt(
  process.env.USERNAME_REDIRECTION_AVAILABILITY_DAY ?? '2',
  10,
);

const updateWebCardUserNameMutation: MutationResolvers['updateWebCardUserName'] =
  async (
    _,
    { webCardId: gqlWebCardId, input: { userName } },
    { loaders, cardUsernamesToRevalidate }: GraphQLContext,
  ) => {
    const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');

    if (!isValidUserName(userName)) {
      throw new GraphQLError(ERRORS.INVALID_WEBCARD_USERNAME);
    }

    const webCard = await loaders.WebCard.load(webCardId);

    if (!webCard) {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
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
    if (webCard.alreadyPublished && nextChangeDate > now) {
      throw new GraphQLError(ERRORS.USERNAME_CHANGE_NOT_ALLOWED_DELAY, {
        extensions: {
          alloweChangeUserNameDate: nextChangeDate,
        },
      });
    }

    //avoid having the same value
    if (webCard.userName === userName) {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }

    const expiresAt = new Date();
    expiresAt.setDate(
      expiresAt.getDate() + USERNAME_REDIRECTION_AVAILABILITY_DAY,
    );

    try {
      await transaction(async () => {
        await updateWebCard(webCard.id, { userName, lastUserNameUpdate: now });
        if (webCard.alreadyPublished) {
          await createRedirectWebCard({
            fromUserName: webCard.userName,
            toUserName: userName,
            expiresAt,
          });

          // TODO I feels this was a mistake, let's see later
          // // remove or udpate prevous redirection. As the specification are not fully detailled
          // // and we can have different option for premium or not,  try to handle different case
          // // existing profile with expiresAt date not expired
          // const currentDate = new Date();
          // await trx
          //   .delete(RedirectWebCardTable)
          //   .where(
          //     and(
          //       eq(RedirectWebCardTable.toUserName, userName),
          //       lt(RedirectWebCardTable.expiresAt, currentDate),
          //     ),
          //   );

          // // existing profile with expiresAt date expired
          // await trx
          //   .update(RedirectWebCardTable)
          //   .set({ toUserName: userName })
          //   .where(eq(RedirectWebCardTable.toUserName, webCard.userName));
        }
      });
    } catch (error) {
      console.log(error);
      throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
    }
    cardUsernamesToRevalidate.add(userName);
    return {
      webCard: { ...webCard, userName, lastUserNameUpdate: now },
    };
  };

export default updateWebCardUserNameMutation;
