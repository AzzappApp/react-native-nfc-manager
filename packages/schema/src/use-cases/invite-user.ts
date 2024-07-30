import * as Sentry from '@sentry/nextjs';
import {
  checkMedias,
  createProfile,
  createUser,
  db,
  getUserByEmailPhoneNumber,
  referencesMedias,
  updateWebCard,
  createFreeSubscriptionForBetaPeriod,
} from '@azzapp/data';
import { createId } from '@azzapp/data/helpers/createId';
import { guessLocale } from '@azzapp/i18n';
import { ProfileAlreadyExistsException } from './exceptions/profile-already-exists.exception';
import { InsufficientSubscriptionException } from './exceptions/subscription.exception';
import { checkSubscription } from './subscription';
import type { GraphQLContext } from '#GraphQLContext';
import type { Profile, User, WebCard } from '@azzapp/data';
import type { Locale } from '@azzapp/i18n';
import type { ContactCard } from '@azzapp/shared/contactCardHelpers';

type Executable<Input, Output> = {
  execute(input: Input): Promise<Output>;
};

type Input = {
  invited: {
    contactCard?: ContactCard & {
      displayedOnWebCard?: boolean;
      isPrivate?: boolean;
      avatarId?: string;
      logoId?: string;
    };
    email?: string;
    phoneNumber?: string;
    profileRole: Profile['profileRole'];
  };
  sendInvite: boolean;
  notifyUsers: GraphQLContext['notifyUsers'];
  owner: User;
  user: User;
  webCard: WebCard;
};

type Output = Profile;

export type InviteUserUseCase = Executable<Input, Output>;

export const inviteUser = async (input: Input) => {
  const { profile: createdProfile, user: existingUser } =
    await db.transactionManager.startTransaction(async tx => {
      if (!input.webCard.isMultiUser) {
        await updateWebCard(input.webCard.id, { isMultiUser: true });
      }

      const existingUser = await getUserByEmailPhoneNumber(
        input.invited.email,
        input.invited.phoneNumber,
      );

      const userId = existingUser?.id ?? createId();

      if (!existingUser) {
        await createUser({
          id: userId,
          email: input.invited.email,
          phoneNumber: input.invited.phoneNumber,
          invited: true,
        });

        await createFreeSubscriptionForBetaPeriod([userId], tx);
      }

      const { displayedOnWebCard, isPrivate, avatarId, logoId, ...data } =
        input.invited.contactCard ?? {};
      let profile: Profile;
      try {
        const addedMedia = [avatarId, logoId].filter(
          mediaId => mediaId,
        ) as string[];
        await checkMedias(addedMedia);
        profile = {
          id: createId(),
          webCardId: input.webCard.id,
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
          profileRole: input.invited.profileRole,
          lastContactCardUpdate: new Date(),
          nbContactCardScans: 0,
          promotedAsOwner: false,
          createdAt: new Date(),
          inviteSent: input.sendInvite,
          deleted: false,
          deletedAt: null,
          deletedBy: null,
        };

        await createProfile(profile, tx);
        await referencesMedias(addedMedia, [], tx);
      } catch (e) {
        throw new ProfileAlreadyExistsException();
      }

      const canBeAdded = await checkSubscription(
        input.owner.id,
        input.webCard.id,
        1,
      );

      if (!canBeAdded) {
        throw new InsufficientSubscriptionException();
      }
      return { profile, user: existingUser };
    });

  await notifyInvitedUser(
    input.webCard,
    input.sendInvite,
    input.invited.phoneNumber,
    input.invited.email,
    input.notifyUsers,
    guessLocale(existingUser?.locale ?? input.user.locale),
  );

  return createdProfile;
};

async function notifyInvitedUser(
  webCard: WebCard,
  sendInvite: boolean,
  phoneNumber: string | undefined,
  email: string | undefined,
  notifyUsers: GraphQLContext['notifyUsers'],
  locale: Locale,
) {
  try {
    if (sendInvite) {
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
  } catch (e) {
    Sentry.captureException(e);
    console.error(e);
    throw e;
  }
}
