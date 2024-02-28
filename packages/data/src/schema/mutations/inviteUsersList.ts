import { createId } from '@paralleldrive/cuid2';
import * as Sentry from '@sentry/nextjs';
import { and, eq, inArray } from 'drizzle-orm';
import { GraphQLError } from 'graphql';
import ERRORS from '@azzapp/shared/errors';
import { isValidEmail } from '@azzapp/shared/stringHelpers';
import {
  ProfileTable,
  UserTable,
  createProfiles,
  createUsers,
  db,
} from '#domains';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { NewProfile } from '#domains';
import type { GraphQLContext } from '#index';
import type {
  InviteUserEmailInput,
  InviteUserRejected,
  MutationResolvers,
} from '#schema/__generated__/types';

const inviteUsersListMutation: MutationResolvers['inviteUsersList'] = async (
  _,
  { profileId: gqlProfileId, invited },
  { auth, loaders, sendMail }: GraphQLContext,
) => {
  const { userId } = auth;

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
  if (!webCard || !webCard.isMultiUser) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const { createdAt, users } = await db.transaction(async trx => {
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
        contactCard: {
          ...data,
          birthday: undefined,
        },
        contactCardDisplayedOnWebCard: displayedOnWebCard ?? true,
        contactCardIsPrivate: displayedOnWebCard ?? false,
        profileRole: invited.profileRole,
        lastContactCardUpdate: new Date(),
        nbContactCardScans: 0,
        promotedAsOwner: false,
        createdAt,
      };

      profileToCreate.push(payload);
    }

    if (profileToCreate.length) {
      await createProfiles(profileToCreate, trx);
    }

    return { createdAt, users };
  });

  const createdProfiles = await db
    .select()
    .from(ProfileTable)
    .where(
      and(
        eq(ProfileTable.webCardId, profile.webCardId),
        eq(ProfileTable.createdAt, createdAt),
      ),
    )
    .then(res => res);

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
    if (sentEmail.length > 0) {
      await sendMail(
        sentEmail.map(email => ({
          email,
          subject: `You have been invited to join ${webCard.userName}`,
          text: `You have been invited to join ${webCard.userName} on Azzapp! Download the app and sign up with this email to join: ${email}`,
          html: `<div>You have been invited to join ${webCard.userName} on Azzapp! Download the app and sign up with this email to join: ${email}</div>`,
        })),
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
