import { eq, sql } from 'drizzle-orm';
import { GraphQLError } from 'graphql';
import { fromGlobalId } from 'graphql-relay';
import ERRORS from '@azzapp/shared/errors';
import { isEditor } from '@azzapp/shared/profileHelpers';
import { WebCardTable, db, follows, isFollowing, unfollows } from '#domains';
import type { WebCard } from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const toggleFollowing: MutationResolvers['toggleFollowing'] = async (
  _,
  { input },
  { auth, loaders },
) => {
  const { profileId, userId } = auth;
  if (!profileId || !userId) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  const profile = await loaders.Profile.load(profileId);
  if (
    !profile ||
    !('profileRole' in profile && isEditor(profile.profileRole))
  ) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const { id: targetId, type } = fromGlobalId(input.webCardId);
  if (type !== 'WebCard') {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  let target: WebCard | null;
  try {
    target = await loaders.WebCard.load(targetId);
  } catch (e) {
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }
  if (!target) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }
  const { follow } = input;

  try {
    await db.transaction(async trx => {
      //fix: https://github.com/AzzappApp/azzapp/issues/1931 && https://github.com/AzzappApp/azzapp/issues/1930
      // if the frontend allows spamming add or remove, this will cause the nbFollowers and nbFollowings to be negative (or opposite)
      // is chking the actual status not enough, we can imaging splitting the function in 2 add/remove
      const currentlyFollowing = await isFollowing(profile.webCardId, targetId);
      if (follow && currentlyFollowing) {
        return;
      }
      if (!follow && !currentlyFollowing) {
        return;
      }
      await trx
        .update(WebCardTable)
        .set({
          nbFollowers: follow
            ? sql`nbFollowers + 1`
            : sql`GREATEST(nbFollowers - 1, 0)`,
        })
        .where(eq(WebCardTable.id, targetId));

      await trx
        .update(WebCardTable)
        .set({
          nbFollowings: follow
            ? sql`nbFollowings + 1`
            : sql`GREATEST(nbFollowings - 1, 0)`,
        })
        .where(eq(WebCardTable.id, profile.webCardId));

      if (follow) await follows(profile.webCardId, targetId, trx);
      else await unfollows(profile.webCardId, targetId, trx);
    });
  } catch (e) {
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }

  return { webCard: target };
};

export default toggleFollowing;
