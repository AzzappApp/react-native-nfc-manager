/* eslint-disable @typescript-eslint/ban-ts-comment */
import { and, eq, lt } from 'drizzle-orm';
import { GraphQLError } from 'graphql';
import ERRORS from '@azzapp/shared/errors';

import { isAdmin } from '@azzapp/shared/profileHelpers';
import {
  db,
  type Profile,
  RedirectWebCardTable,
  updateWebCard,
} from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';
import type { GraphQLContext } from '../GraphQLContext';

const USERNAME_CHANGE_FREQUENCY_DAY = parseInt(
  process.env.USERNAME_CHANGE_FREQUENCY_DAY ?? '30',
  10,
);

const USERNAME_REDIRECTION_AVAILABILITY_DAY = parseInt(
  process.env.USERNAME_REDIRECTION_AVAILABILITY_DAY ?? '30',
  10,
);

const updateWebCardUserNameMutation: MutationResolvers['updateWebCardUserName'] =
  async (
    _,
    args,
    { auth, loaders, cardUsernamesToRevalidate }: GraphQLContext,
  ) => {
    const { profileId } = auth;
    if (!profileId) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
    }

    let profile: Profile | null;
    try {
      profile = await loaders.Profile.load(profileId);
    } catch (e) {
      throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
    }

    if (!profile || !isAdmin(profile.profileRole)) {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
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
    // Check if lastUpdate is earlier than thirtyDaysAgo;
    if (nextChangeDate > now) {
      throw new GraphQLError(ERRORS.USERNAME_CHANGE_NOT_ALLOWED_DELAY, {
        extensions: {
          alloweChangeUserNameDate: nextChangeDate,
        },
      });
    }

    const { userName } = args.input;

    //avoid h4ving the same value
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
        await trx.insert(RedirectWebCardTable).values({
          fromUserName: webCard.userName,
          toUserName: userName,
          expiresAt,
        });
        //remove or udpate prevous redirection. As the specification are not fully detailled
        // and we can have different option for premium or not,  try to handle different case
        // existing profile with expiresAt date not expired
        const currentDate = new Date();
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
