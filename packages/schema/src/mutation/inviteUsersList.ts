import * as Sentry from '@sentry/nextjs';
import { GraphQLError } from 'graphql';
import {
  createProfiles,
  createUsers,
  updateWebCard,
  transaction,
  getUsersByEmail,
  getProfilesByIds,
  createId,
  getProfilesByWebCard,
  updateProfile,
} from '@azzapp/data';
import { guessLocale } from '@azzapp/i18n';
import ERRORS from '@azzapp/shared/errors';
import { profileHasAdminRight } from '@azzapp/shared/profileHelpers';
import { isValidEmail } from '@azzapp/shared/stringHelpers';
import { notifyUsers, sendPushNotification } from '#externals';
import { getSessionInfos } from '#GraphQLContext';
import {
  profileLoader,
  userLoader,
  webCardLoader,
  webCardOwnerLoader,
} from '#loaders';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import { validateCurrentSubscription } from '#helpers/subscriptionHelpers';
import type {
  InviteUserEmailInput,
  InviteUserRejected,
  MutationResolvers,
} from '#/__generated__/types';
import type { NewProfile, Profile } from '@azzapp/data';

const inviteUsersListMutation: MutationResolvers['inviteUsersList'] = async (
  _,
  { profileId: gqlProfileId, invited, sendInvite },
) => {
  const { userId } = getSessionInfos();

  if (!userId) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  const user = await userLoader.load(userId);

  const profileId = fromGlobalIdWithType(gqlProfileId, 'Profile');
  const profile = profileId && (await profileLoader.load(profileId));
  if (!profile) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  if (profile.userId !== userId) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }
  if (!profileHasAdminRight(profile.profileRole)) {
    throw new GraphQLError(ERRORS.FORBIDDEN, {
      extensions: {
        role: profile.profileRole,
      },
    });
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

  const webCard = await webCardLoader.load(profile.webCardId);
  if (!webCard) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const { users, createdProfiles } = await transaction(async () => {
    if (!webCard.isMultiUser) {
      await updateWebCard(webCard.id, { isMultiUser: true });
    }

    let userId;

    await createUsers(
      filtered.map(f => ({
        id: f.id,
        email: f.email,
        invited: true,
      })),
    );

    const users = (await getUsersByEmail(filtered.map(f => f.email))).filter(
      user => !!user,
    );

    const profiles = await getProfilesByWebCard(webCard.id);

    const profileToCreate: NewProfile[] = [];
    const profilesToUpdate: Array<Partial<Profile> & Pick<Profile, 'id'>> = [];

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

      const existingProfile = profiles.find(
        profile => profile.userId === existingUser.id,
      );

      userId = existingUser.id;
      const { displayedOnWebCard, isPrivate, avatarId, ...data } =
        invited.contactCard ?? {};

      const payload = {
        webCardId: profile.webCardId,
        userId,
        avatarId,
        invited: true,
        invitedBy: profileId,
        inviteSent: sendInvite ?? false,
        contactCard: {
          ...data,
          birthday: undefined,
        },
        contactCardDisplayedOnWebCard: displayedOnWebCard ?? true,
        contactCardIsPrivate: displayedOnWebCard ?? false,
        profileRole: invited.profileRole ?? 'user',
        nbContactCardScans: 0,
        nbShareBacks: 0,
        promotedAsOwner: false,
        createdAt,
      };

      if (existingProfile?.deleted) {
        profilesToUpdate.push({
          id: existingProfile.id,
          deletedAt: null,
          deletedBy: null,
          deleted: false,
          ...payload,
        });
      } else if (!existingProfile) {
        profileToCreate.push(payload);
      }
    }

    let createdProfileIds: string[] = [];
    if (profileToCreate.length) {
      createdProfileIds = await createProfiles(profileToCreate);
    }
    for (const { id, ...profile } of profilesToUpdate) {
      await updateProfile(id, profile);
    }

    const createdProfiles = (
      await getProfilesByIds([
        ...createdProfileIds,
        ...profilesToUpdate.map(({ id }) => id),
      ])
    ).filter(profile => !!profile);

    const owner = await webCardOwnerLoader.load(profile.webCardId);

    if (!owner) {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }

    await validateCurrentSubscription(
      owner.id,
      createdProfiles.length + (webCard.isMultiUser ? 0 : 1),
      true,
    ); // seats are already added in the transaction, we just check that available seats are bigger or equal to 0

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
    if (user && webCard.userName) {
      await sendPushNotification(user.id, {
        type: 'multiuser_invitation',
        mediaId: webCard.coverMediaId,
        deepLink: 'multiuser_invitation',
        localeParams: { userName: webCard.userName },
        locale: guessLocale(user?.locale),
      });
    }
  }

  try {
    if (sentEmail.length > 0 && sendInvite) {
      await Promise.allSettled(
        sentEmail.map(email =>
          notifyUsers(
            'email',
            [email],
            webCard,
            'invitation',
            guessLocale(user?.locale),
          ),
        ),
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
