/* eslint-disable @typescript-eslint/ban-ts-comment */
import { and, eq, lt } from 'drizzle-orm';
import { GraphQLError } from 'graphql';
import ERRORS from '@azzapp/shared/errors';
import { isAdmin } from '@azzapp/shared/profileHelpers';
import {
  db,
  RedirectWebCardTable,
  updateWebCard,
  getUserProfileWithWebCardId,
} from '#domains';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#schema/__generated__/types';
import type { GraphQLContext } from '../GraphQLContext';

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
    { input: { webCardId: gqlWebCardId, userName } },
    { auth, loaders, cardUsernamesToRevalidate }: GraphQLContext,
  ) => {
    const { userId } = auth;
    const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');
    const profile =
      userId && (await getUserProfileWithWebCardId(userId, webCardId));

    if (!profile || !isAdmin(profile.profileRole)) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
    }

    const webCard = await loaders.WebCard.load(profile.webCardId);

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
      await db.transaction(async trx => {
        await updateWebCard(
          webCard.id,
          { userName, lastUserNameUpdate: now },
          trx,
        );
        if (webCard.alreadyPublished) {
          await trx.insert(RedirectWebCardTable).values({
            fromUserName: webCard.userName,
            toUserName: userName,
            expiresAt,
          });
          //remove or udpate prevous redirection. As the specification are not fully detailled
          // and we can have different option for premium or not,  try to handle different case
          // existing profile with expiresAt date not expired
          const currentDate = new Date();
          //create a redirection only if it was published

          await trx
            .delete(RedirectWebCardTable)
            .where(
              and(
                eq(RedirectWebCardTable.toUserName, userName),
                lt(RedirectWebCardTable.expiresAt, currentDate),
              ),
            );

          // existing profile with expiresAt date expired
          await trx
            .update(RedirectWebCardTable)
            .set({ toUserName: userName })
            .where(and(eq(RedirectWebCardTable.toUserName, webCard.userName)));
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
