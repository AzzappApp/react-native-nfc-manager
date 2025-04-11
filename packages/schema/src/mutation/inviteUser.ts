import { GraphQLError } from 'graphql';
import {
  checkMedias,
  createId,
  createProfile,
  createUser,
  getProfileByUserAndWebCard,
  getUserByEmailPhoneNumber,
  referencesMedias,
  transaction,
  updateProfile,
  updateUser,
  updateWebCard,
} from '@azzapp/data';
import { guessLocale } from '@azzapp/i18n';
import ERRORS from '@azzapp/shared/errors';
import { profileHasAdminRight } from '@azzapp/shared/profileHelpers';
import {
  formatPhoneNumber,
  isInternationalPhoneNumber,
  isValidEmail,
} from '@azzapp/shared/stringHelpers';
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
import type { MutationResolvers } from '#__generated__/types';
import type { Profile } from '@azzapp/data';

const inviteUserMutation: MutationResolvers['inviteUser'] = async (
  _,
  { profileId: gqlProfileId, invited, sendInvite },
) => {
  const profileId = fromGlobalIdWithType(gqlProfileId, 'Profile');
  const { userId } = getSessionInfos();
  const { email, phoneNumber: rawPhoneNumber } = invited;

  const profile = await profileLoader.load(profileId);
  if (!profile || profile.userId !== userId) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  if (email && !isValidEmail(email)) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  if (rawPhoneNumber && !isInternationalPhoneNumber(rawPhoneNumber)) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const phoneNumber = rawPhoneNumber
    ? formatPhoneNumber(rawPhoneNumber)
    : undefined;

  if (!email && !phoneNumber) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  if (!profileHasAdminRight(profile.profileRole)) {
    throw new GraphQLError(ERRORS.FORBIDDEN, {
      extensions: {
        role: profile.profileRole,
      },
    });
  }

  if (invited.profileRole === 'owner') {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const owner = await webCardOwnerLoader.load(profile.webCardId);
  const user = await userLoader.load(userId);
  const webCard = await webCardLoader.load(profile.webCardId);

  if (!owner || !user || !webCard) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  await validateCurrentSubscription(owner.id, {
    webCardIsPublished: webCard.cardIsPublished,
    action: 'UPDATE_MULTI_USER',
    addedSeats: webCard.isMultiUser ? 1 : 2,
  }); //add owner

  try {
    const { avatarId, logoId, bannerId } = invited.contactCard ?? {};
    const addedMedia = [avatarId, logoId, bannerId].filter(
      mediaId => mediaId != null,
    );
    await checkMedias(addedMedia);

    const { profile, existingUser } = await transaction(async () => {
      if (!webCard.isMultiUser) {
        await updateWebCard(webCard.id, { isMultiUser: true });
      }

      const existingUser = await getUserByEmailPhoneNumber(
        invited.email ?? undefined,
        phoneNumber ?? undefined,
      );

      let userId: string;
      let existingProfile: Profile | null = null;

      if (!existingUser) {
        userId = await createUser({
          email: invited.email,
          phoneNumber,
          invited: true,
        });
      } else if (existingUser && existingUser.deleted) {
        if (existingUser.deletedBy !== existingUser.id) {
          throw new GraphQLError(ERRORS.USER_IS_BLOCKED);
        }

        userId = await transaction(async () => {
          const userId = createId();
          await updateUser(existingUser.id, {
            appleId: null,
            email: null,
            phoneNumber: null,
            replacedBy: userId,
          });
          await createUser({
            id: userId,
            email: invited.email,
            phoneNumber,
            invited: true,
          });
          return userId;
        });
      } else {
        userId = existingUser.id;

        const foundProfile = await getProfileByUserAndWebCard(
          existingUser.id,
          webCard.id,
        );

        if (foundProfile && !foundProfile.deleted) {
          throw new GraphQLError(ERRORS.PROFILE_ALREADY_EXISTS);
        }

        existingProfile = foundProfile;
      }

      const {
        displayedOnWebCard,
        isPrivate,
        avatarId,
        logoId,
        bannerId,
        ...data
      } = invited.contactCard ?? {};

      const creationDate = new Date();

      const profileData = {
        webCardId: webCard.id,
        userId,
        avatarId: avatarId ?? null,
        logoId: logoId ?? null,
        bannerId: bannerId ?? null,
        invited: true,
        invitedBy: profileId,
        contactCard: data,
        contactCardDisplayedOnWebCard: displayedOnWebCard ?? true,
        contactCardIsPrivate: displayedOnWebCard ?? false,
        profileRole: invited.profileRole,
        lastContactCardUpdate: creationDate,
        nbContactCardScans: 0,
        nbShareBacks: 0,
        nbContactsImportFromScan: 0,
        promotedAsOwner: false,
        createdAt: creationDate,
        inviteSent: !!sendInvite,
        deleted: false,
        deletedAt: null,
        deletedBy: null,
        lastContactViewAt: creationDate,
        hasGooglePass: false,
      };
      await referencesMedias(
        addedMedia,
        [
          existingProfile?.avatarId ?? null,
          existingProfile?.logoId ?? null,
          existingProfile?.bannerId ?? null,
        ].filter(mediaId => mediaId),
      );

      if (existingProfile) {
        await updateProfile(existingProfile.id, profileData);
        return {
          profile: {
            ...profileData,
            id: existingProfile.id,
          },
          existingUser,
        };
      } else {
        const createdProfileId = await createProfile(profileData);

        return {
          profile: {
            ...profileData,
            id: createdProfileId,
          },
          existingUser,
        };
      }
    });

    if (existingUser) {
      const locale = guessLocale(existingUser?.locale ?? user.locale);
      if (webCard.userName) {
        await sendPushNotification(existingUser.id, {
          notification: {
            type: 'multiuser_invitation',
          },
          mediaId: webCard.coverMediaId,
          localeParams: { userName: webCard.userName },
          locale,
        });
      }
    }

    if (sendInvite) {
      const locale = guessLocale(existingUser?.locale ?? user.locale);
      if (phoneNumber) {
        await notifyUsers(
          'phone',
          [phoneNumber],
          webCard,
          'invitation',
          locale,
        );
      } else if (email) {
        await notifyUsers('email', [email], webCard, 'invitation', locale);
      }
    }

    return { profile };
  } catch (e) {
    console.error(e);
    if (e instanceof GraphQLError) {
      throw e;
    }
    console.error(e);
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }
};

export default inviteUserMutation;
