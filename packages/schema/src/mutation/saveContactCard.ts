import { GraphQLError } from 'graphql';
import {
  buildDefaultContactCard,
  getContactCardAccessForProfile,
  getPushTokens,
  referencesMedias,
  transaction,
  updateProfile,
} from '@azzapp/data';
import { DEFAULT_LOCALE } from '@azzapp/i18n';
import { checkMedias } from '@azzapp/service/mediaServices/mediaServices';
import ERRORS from '@azzapp/shared/errors';
import { notifyApplePassWallet, notifyGooglePassWallet } from '#externals';
import { getSessionUser } from '#GraphQLContext';
import { profileLoader, webCardLoader, webCardOwnerLoader } from '#loaders';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import { validateCurrentSubscription } from '#helpers/subscriptionHelpers';
import type { ContactCard, MutationResolvers } from '#/__generated__/types';
import type { Profile } from '@azzapp/data';

const saveContactCard: MutationResolvers['saveContactCard'] = async (
  _,
  { profileId: gqlProfileId, contactCard },
  context,
) => {
  const user = await getSessionUser();
  if (!user) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }
  const profileId = fromGlobalIdWithType(gqlProfileId, 'Profile');
  const profile = await profileLoader.load(profileId);
  if (!profile) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }
  if (profile.userId !== user.id) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  const webCard = await webCardLoader.load(profile.webCardId);

  if (!webCard) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const contactCardUpdates: Partial<ContactCard> = {
    ...(profile.contactCard ??
      (await buildDefaultContactCard(webCard, user.id))),
    ...contactCard,
  };

  const updates: Partial<Profile> = {
    contactCard: contactCardUpdates,
  };

  updates.avatarId = contactCard.avatarId;
  updates.logoId = contactCard.logoId;
  updates.bannerId = contactCard.bannerId;

  const owner =
    profile.profileRole === 'owner'
      ? profile.userId
      : (await webCardOwnerLoader.load(webCard.id))?.id;

  if (!owner) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  await validateCurrentSubscription(
    owner,
    {
      action: 'UPDATE_CONTACT_CARD',
      contactCardHasCompanyName: !!updates.contactCard?.company,
      webCardIsPublished: webCard.cardIsPublished,
      contactCardHasUrl: !!updates.contactCard?.urls?.length,
      contactCardHasLogo: !!updates.logoId,
    },
    context.apiEndpoint,
  );

  try {
    const addedMedia = [
      contactCard.logoId,
      contactCard.avatarId,
      contactCard.bannerId,
    ].filter(mediaId => mediaId) as string[];
    await checkMedias(addedMedia);
    await transaction(async () => {
      await updateProfile(profileId, updates);
      await referencesMedias(addedMedia, [
        profile.logoId,
        profile.avatarId,
        profile.bannerId,
      ]);
    });
  } catch (e) {
    console.error(e);
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }

  const contactCardsAccesses = await getContactCardAccessForProfile(profileId);

  const pushTokens = await getPushTokens(
    contactCardsAccesses.map(c => c.id).concat(profileId), // we add profile id for legacy passes
  );
  if (pushTokens.length) {
    pushTokens.map(notifyApplePassWallet);
  }

  contactCardsAccesses
    .filter(contactCardAccess => contactCardAccess.hasGooglePass)
    .map(c => notifyGooglePassWallet(c.id, user?.locale ?? DEFAULT_LOCALE));

  if (profile.hasGooglePass) {
    notifyGooglePassWallet(profile.id, user?.locale ?? DEFAULT_LOCALE);
  }

  return {
    profile: {
      ...profile,
      ...updates,
    },
  };
};

export default saveContactCard;
