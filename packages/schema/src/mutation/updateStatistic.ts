import { GraphQLError } from 'graphql';
import {
  incrementWebCardViews,
  incrementContactCardScans,
  incrementContactCardTotalScans,
  transaction,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { profileLoader, webCardLoader } from '#loaders';
import fromGlobalIdWithType, {
  maybeFromGlobalIdWithType,
} from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#/__generated__/types';

const updateWebCardViews: MutationResolvers['updateWebCardViews'] = async (
  _,
  { input: { webCardId: gqlWebCardId, profileId: gqlProfileId } },
) => {
  const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');

  const profileId = gqlProfileId
    ? fromGlobalIdWithType(gqlProfileId, 'Profile')
    : null;

  const profile = profileId ? await profileLoader.load(profileId) : null;

  const webCard = await webCardLoader.load(webCardId);

  if (!webCard) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  try {
    if (profile?.webCardId !== webCardId) {
      await incrementWebCardViews(webCardId);
    }

    return true;
  } catch {
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }
};

const updateContactCardScans: MutationResolvers['updateContactCardScans'] =
  async (
    _,
    {
      input: { scannedProfileId: gqlScannedProfileId, profileId: gqlProfileId },
    },
  ) => {
    const scannedProfileId =
      maybeFromGlobalIdWithType(gqlScannedProfileId, 'Profile') ??
      gqlScannedProfileId;
    const profileId = gqlProfileId
      ? fromGlobalIdWithType(gqlProfileId, 'Profile')
      : null;

    const scannedProfile = profileLoader.load(scannedProfileId);

    if (!scannedProfile) {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }

    try {
      if (scannedProfileId !== profileId) {
        await transaction(async () => {
          await incrementContactCardTotalScans(scannedProfileId);
          await incrementContactCardScans(scannedProfileId, true);
        });
      }

      return true;
    } catch {
      throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
    }
  };

export { updateWebCardViews, updateContactCardScans };
