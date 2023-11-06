import { and, eq } from 'drizzle-orm';
import { GraphQLError } from 'graphql';
import ERRORS from '@azzapp/shared/errors';
import { isAdmin } from '@azzapp/shared/profileHelpers';
import { UserTable, createProfile, createUser, db } from '#domains';
import type { GraphQLContext } from '#index';
import type { MutationResolvers } from '#schema/__generated__/types';
import type { SQLWrapper } from 'drizzle-orm';

const inviteUserMutation: MutationResolvers['inviteUser'] = async (
  _,
  { input },
  { auth, loaders }: GraphQLContext,
) => {
  const { profileId } = auth;
  const { email, phoneNumber } = input;

  if (!profileId) throw new GraphQLError(ERRORS.UNAUTHORIZED);
  if (!email && !phoneNumber) throw new GraphQLError(ERRORS.INVALID_REQUEST);

  const filters: SQLWrapper[] = [];

  if (email) filters.push(eq(UserTable.email, email));
  if (phoneNumber) filters.push(eq(UserTable.phoneNumber, phoneNumber));

  const invitedUser = await db
    .select()
    .from(UserTable)
    .where(and(...filters))
    .then(res => res.pop());

  const profile = await loaders.Profile.load(profileId);

  const webCard = profile
    ? await loaders.WebCard.load(profile.webCardId)
    : null;

  if (
    !profile ||
    !webCard ||
    !webCard.isMultiUser ||
    !isAdmin(profile.profileRole)
  )
    throw new GraphQLError(ERRORS.INVALID_REQUEST);

  let createdProfileId;
  await db.transaction(async trx => {
    const userId =
      invitedUser?.id ??
      (await createUser(
        {
          email,
          phoneNumber,
          invited: true,
        },
        trx,
      ));

    const { displayedOnWebCard, isPrivate, avatarId, ...data } =
      input.contactCard ?? {};

    const payload = {
      webCardId: profile.webCardId,
      userId,
      avatarId,
      invited: true,
      contactCard: {
        ...data,
        birthday: data.birthday ?? undefined,
      },
      contactCardDisplayedOnWebCard: displayedOnWebCard ?? true,
      contactCardIsPrivate: displayedOnWebCard ?? false,
      profileRole: input.profileRole,
      lastContactCardUpdate: new Date(),
      nbContactCardScans: 0,
      promotedAsOwner: false,
    };

    createdProfileId = await createProfile(payload, trx);
  });

  if (!createdProfileId) throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);

  const createdProfile = await loaders.Profile.load(createdProfileId);

  return {
    profile: createdProfile,
  };
};

export default inviteUserMutation;
