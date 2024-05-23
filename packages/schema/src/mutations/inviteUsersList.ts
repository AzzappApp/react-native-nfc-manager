import { createId } from '@paralleldrive/cuid2';
import * as Sentry from '@sentry/nextjs';
import { and, eq, inArray } from 'drizzle-orm';
import { GraphQLError } from 'graphql';
import {
  ProfileTable,
  UserTable,
  createProfiles,
  createUsers,
  db,
  updateWebCard,
} from '@azzapp/data';
import { guessLocale } from '@azzapp/i18n';
import ERRORS from '@azzapp/shared/errors';
import { isValidEmail } from '@azzapp/shared/stringHelpers';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import { checkSubscription } from '#use-cases/subscription';
import type {
  InviteUserEmailInput,
  InviteUserRejected,
  MutationResolvers,
} from '#/__generated__/types';
import type { GraphQLContext } from '#index';
import type { NewProfile } from '@azzapp/data';

const inviteUsersListMutation: MutationResolvers['inviteUsersList'] = async (
  _,
  { profileId: gqlProfileId, invited, sendInvite },
  { auth, loaders, notifyUsers }: GraphQLContext,
) => {
  const { userId } = auth;

  if (!userId) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  const user = await loaders.User.load(userId);

  const profileId = fromGlobalIdWithType(gqlProfileId, 'Profile');
  const profile = profileId && (await loaders.Profile.load(profileId));
  if (!profile) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  if (profile.userId !== userId) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  const rejected: InviteUserRejected[] = [];
  const filtered: Array<InviteUserEmailInput & { id: string }> = [];

  if (invited.length > 5000) {
    throw new GraphQLError(ERRORS.PAYLOAD_TOO_LARGE);
  }

  if (invited.length === 0) {
    return {
      rejected: [],
      added: [],
    };
  }

  for (const input of invited) {
    const { email } = input;

    if (!email || !isValidEmail(email)) {
      rejected.push({ ...input, reason: 'wrongEmail' });
    } else {
      filtered.push({
        ...input,
        id: createId(),
      });
    }
  }

  const webCard = await loaders.WebCard.load(profile.webCardId);
  if (!webCard) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const { users, createdProfiles } = await db.transaction(async trx => {
    if (!webCard.isMultiUser) {
      await updateWebCard(webCard.id, { isMultiUser: true }, trx);
    }

    let userId;

    await createUsers(
      filtered.map(f => ({
        id: f.id,
        email: f.email,
        invited: true,
      })),
      trx,
    );

    const users = filtered.length
      ? await trx
          .select()
          .from(UserTable)
          .where(
            inArray(
              UserTable.email,
              filtered.map(f => f.email),
            ),
          )
      : [];

    const profileToCreate: NewProfile[] = [];

    const createdAt = new Date();
    for (const invited of filtered) {
      const { email } = invited;

      const existingUser = users.find(user => user.email === email);

      if (!existingUser) {
        rejected.push({
          ...invited,
          reason: 'unknownError',
        });
        continue;
      }

      userId = existingUser.id;
      const { displayedOnWebCard, isPrivate, avatarId, ...data } =
        invited.contactCard ?? {};

      const payload = {
        webCardId: profile.webCardId,
        userId,
        avatarId,
        invited: true,
        inviteSent: sendInvite ?? false,
        contactCard: {
          ...data,
          birthday: undefined,
        },
        contactCardDisplayedOnWebCard: displayedOnWebCard ?? true,
        contactCardIsPrivate: displayedOnWebCard ?? false,
        profileRole: invited.profileRole ?? 'user',
        nbContactCardScans: 0,
        promotedAsOwner: false,
        createdAt,
      };

      profileToCreate.push(payload);
    }

    if (profileToCreate.length) {
      await createProfiles(profileToCreate, trx);
    }

    const createdProfiles = await trx
      .select()
      .from(ProfileTable)
      .where(
        and(
          eq(ProfileTable.webCardId, profile.webCardId),
          eq(ProfileTable.createdAt, createdAt),
        ),
      )
      .then(res => res);

    const owner = await loaders.webCardOwners.load(profile.webCardId);

    if (!owner) {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }

    const canBeAdded = await checkSubscription(
      owner.id,
      webCard.id,
      createdProfiles.length,
    );

    if (!canBeAdded) {
      throw new GraphQLError(ERRORS.SUBSCRIPTION_REQUIRED);
    }

    return { users, createdProfiles };
  });

  const sentEmail: string[] = [];
  for (const invited of filtered) {
    const user = users.find(user => user.email === invited.email);
    if (user) {
      const createdProfile = createdProfiles.find(
        profile => profile.userId === user!.id,
      );
      if (createdProfile) {
        sentEmail.push(invited.email);
      } else {
        rejected.push({
          ...invited,
          reason: 'alreadyInvited',
        });
      }
    }
  }

  try {
    if (sentEmail.length > 0 && sendInvite) {
      await notifyUsers(
        'email',
        sentEmail,
        webCard,
        'invitation',
        guessLocale(user?.locale),
      );
    }
  } catch (e) {
    Sentry.captureException(e);
    console.error(e);
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }

  return {
    rejected,
    added: createdProfiles,
  };
};

export default inviteUsersListMutation;
