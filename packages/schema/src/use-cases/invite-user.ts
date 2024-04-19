import { createId } from '@paralleldrive/cuid2';
import * as Sentry from '@sentry/nextjs';
import {
  createProfile,
  createUser,
  db,
  getUserByEmailPhoneNumber,
  getWebCardByProfileId,
  updateWebCard,
} from '@azzapp/data';
import { ProfileAlreadyExistsException } from './exceptions/profile-already-exists.exception';
import { ProfileDoesNotExistException } from './exceptions/profile-does-not-exist.exception';
import type { GraphQLContext } from '#GraphQLContext';
import type { Profile, WebCard } from '@azzapp/data';
import type { ContactCard } from '@azzapp/shared/contactCardHelpers';

type Executable<Input, Output> = {
  execute(input: Input): Promise<Output>;
};

type Input = {
  auth: {
    profileId: string;
  };
  invited: {
    contactCard?: ContactCard & {
      displayedOnWebCard?: boolean;
      isPrivate?: boolean;
      avatarId?: string;
    };
    email?: string;
    phoneNumber?: string;
    profileRole: Profile['profileRole'];
  };
  sendInvite: boolean;
  sendMail: GraphQLContext['sendMail'];
  sendSms: GraphQLContext['sendSms'];
};

type Output = Profile;

export type InviteUserUseCase = Executable<Input, Output>;

export const inviteUser = async (input: Input) => {
  const webCard = await getWebCardByProfileId(input.auth.profileId);

  if (!webCard) throw new ProfileDoesNotExistException();

  const createdProfile = await db.transactionManager.startTransaction(
    async tx => {
      if (!webCard.isMultiUser) {
        await updateWebCard(webCard.id, { isMultiUser: true });
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
      }

      const { displayedOnWebCard, isPrivate, avatarId, ...data } =
        input.invited.contactCard ?? {};

      try {
        const profile: Profile = {
          id: createId(),
          webCardId: webCard.id,
          userId,
          avatarId: avatarId ?? null,
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
        return profile;
      } catch (e) {
        throw new ProfileAlreadyExistsException();
      }
    },
  );

  await notifyInvitedUser(
    webCard,
    input.sendInvite,
    input.invited.phoneNumber,
    input.invited.email,
    input.sendMail,
    input.sendSms,
  );

  return createdProfile;
};

async function notifyInvitedUser(
  webCard: WebCard,
  sendInvite: boolean,
  phoneNumber: string | undefined,
  email: string | undefined,
  sendMail: (
    p: Array<{
      email: string;
      subject: string;
      text: string;
      html: string;
    }>,
  ) => Promise<void>,
  sendSms: (p: { phoneNumber: string; body: string }) => Promise<void>,
) {
  try {
    if (sendInvite) {
      if (phoneNumber) {
        await sendSms({
          body: `You have been invited to join ${webCard.userName} on Azzapp! Download the app and sign up with this phone number to join: ${phoneNumber}`,
          phoneNumber,
        });
      } else if (email) {
        await sendMail([
          {
            email,
            subject: `You have been invited to join ${webCard.userName}`,
            text: `You have been invited to join ${webCard.userName} on Azzapp! Download the app and sign up with this email to join: ${email}`,
            html: `<div>You have been invited to join ${webCard.userName} on Azzapp! Download the app and sign up with this email to join: ${email}</div>`,
          },
        ]);
      }
    }
  } catch (e) {
    Sentry.captureException(e);
    console.error(e);
    throw e;
  }
}
