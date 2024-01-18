import { GraphQLError } from 'graphql';
import ERRORS from '@azzapp/shared/errors';
import {
  incrementWebCardViews,
  incrementContactCardScans,
  db,
  updateContactCardTotalScans,
} from '#domains';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#schema/__generated__/types';

const updateWebCardViews: MutationResolvers['updateWebCardViews'] = async (
  _,
  { input: { webCardId: gqlWebCardId, profileId: gqlProfileId } },
  { loaders },
) => {
  const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');

  const profileId = gqlProfileId
    ? fromGlobalIdWithType(gqlProfileId, 'Profile')
    : null;

  const profile = profileId ? await loaders.Profile.load(profileId) : null;

  const webCard = await loaders.WebCard.load(webCardId);

  if (!webCard) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  try {
    if (profile?.webCardId !== webCardId) {
      await incrementWebCardViews(webCardId);
    }

    return true;
  } catch (error) {
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }
};

const updateContactCardScans: MutationResolvers['updateContactCardScans'] =
  async (
    _,
    {
      input: { scannedProfileId: gqlScannedProfileId, profileId: gqlProfileId },
    },
    { loaders },
  ) => {
    const scannedProfileId = fromGlobalIdWithType(
      gqlScannedProfileId,
      'Profile',
    );
    const profileId = gqlProfileId
      ? fromGlobalIdWithType(gqlProfileId, 'Profile')
      : null;

    const scannedProfile = loaders.Profile.load(scannedProfileId);

    if (!scannedProfile) {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }

    try {
      if (scannedProfileId !== profileId) {
        await db.transaction(async tx => {
          await updateContactCardTotalScans(scannedProfileId, tx);
          await incrementContactCardScans(scannedProfileId, true, tx);
        });
      }

      return true;
    } catch (error) {
      throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
    }
  };

export { updateWebCardViews, updateContactCardScans };
