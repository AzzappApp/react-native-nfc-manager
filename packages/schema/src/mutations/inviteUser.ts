import { GraphQLError } from 'graphql';
import {
  checkMedias,
  createFreeSubscriptionForBetaPeriod,
  createProfile,
  createUser,
  getProfileByUserAndWebCard,
  getUserByEmailPhoneNumber,
  referencesMedias,
  transaction,
  updateWebCard,
} from '@azzapp/data';
import { guessLocale } from '@azzapp/i18n';
import ERRORS from '@azzapp/shared/errors';
import {
  formatPhoneNumber,
  isInternationalPhoneNumber,
  isValidEmail,
} from '@azzapp/shared/stringHelpers';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import { checkSubscription } from '#helpers/subscriptionHelpers';
import type { MutationResolvers } from '#__generated__/types';
import type { GraphQLContext } from '#index';

const inviteUserMutation: MutationResolvers['inviteUser'] = async (
  _,
  { profileId: gqlProfileId, invited, sendInvite },
  { notifyUsers, auth, loaders }: GraphQLContext,
) => {
  const profileId = fromGlobalIdWithType(gqlProfileId, 'Profile');

  const { email, phoneNumber: rawPhoneNumber } = invited;

  if (email && !isValidEmail(email)) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  if (rawPhoneNumber && !isInternationalPhoneNumber(rawPhoneNumber)) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const phoneNumber = rawPhoneNumber
    ? formatPhoneNumber(rawPhoneNumber)
    : undefined;

  if (!email && !phoneNumber) throw new GraphQLError(ERRORS.INVALID_REQUEST);

  const profile = await loaders.Profile.load(profileId);

  if (!profile || profile.userId !== auth.userId) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const owner = await loaders.webCardOwners.load(profile.webCardId);

  const user = await loaders.User.load(auth.userId);

  const webCard = await loaders.WebCard.load(profile.webCardId);

  if (!owner || !user || !webCard) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  if (!(await checkSubscription(owner.id, webCard.id, 1))) {
    throw new GraphQLError(ERRORS.SUBSCRIPTION_REQUIRED);
  }

  try {
    const { avatarId, logoId } = invited.contactCard ?? {};
    const addedMedia = [avatarId, logoId].filter(mediaId => mediaId != null);
    await checkMedias(addedMedia);

    const { profile, existingUser } = await transaction(async () => {
      if (!webCard.isMultiUser) {
        await updateWebCard(webCard.id, { isMultiUser: true });
      }

      const existingUser = await getUserByEmailPhoneNumber(
        invited.email ?? undefined,
        invited.phoneNumber ?? undefined,
      );

      let userId: string;

      if (!existingUser) {
        userId = await createUser({
          email: invited.email,
          phoneNumber: invited.phoneNumber,
          invited: true,
        });
        await createFreeSubscriptionForBetaPeriod([userId]);
      } else {
        const existingProfile = await getProfileByUserAndWebCard(
          existingUser.id,
          webCard.id,
        );
        if (existingProfile) {
          throw new GraphQLError(ERRORS.PROFILE_ALREADY_EXISTS);
        }
        userId = existingUser.id;
      }

      const { displayedOnWebCard, isPrivate, avatarId, logoId, ...data } =
        invited.contactCard ?? {};

      const profileData = {
        webCardId: webCard.id,
        userId,
        avatarId: avatarId ?? null,
        logoId: logoId ?? null,
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
        createdAt: new Date(),
        inviteSent: !!sendInvite,
        deleted: false,
        deletedAt: null,
        deletedBy: null,
      };
      const profileId = await createProfile(profileData);
      await referencesMedias(addedMedia, []);

      return {
        profile: {
          ...profileData,
          id: profileId,
        },
        existingUser,
      };
    });

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
    if (e instanceof GraphQLError) {
      throw e;
    }
    console.error(e);
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }
};

export default inviteUserMutation;
