import ERRORS from '@azzapp/shared/errors';
import serializeAndSignContactCard from '@azzapp/shared/serializeAndSignContactCard';
import { getLastProfileStatisticsFor } from '#domains/profileStatistics';
import { idResolver } from './utils';
import type { ProfileResolvers } from './__generated__/types';

export const Profile: ProfileResolvers = {
  id: idResolver('Profile'),
  user: async (userProfile, _, { loaders }) => {
    const user = await loaders.User.load(userProfile.userId);

    if (!user) throw new Error(ERRORS.GRAPHQL_ERROR);
    return user;
  },
  avatar: async profile =>
    profile.avatarId
      ? {
          media: profile.avatarId,
          assetKind: 'contactCard',
        }
      : null,
  contactCard: async (profile, _, { auth, loaders }) => {
    const userProfile = auth.profileId
      ? await loaders.Profile.load(auth.profileId)
      : null;

    const isSameWebCard = userProfile?.webCardId === profile.webCardId;

    if (!isSameWebCard && profile.userId !== auth.userId) {
      return null;
    }

    return profile.contactCard;
  },
  statsSummary: async profile => {
    //get data for the last 30 day
    const result = await getLastProfileStatisticsFor(profile.id, 30);
    return result;
  },
  serializedContactCard: async (profile, _, { loaders }) => {
    const webCard = await loaders.WebCard.load(profile.webCardId);

    return serializeAndSignContactCard(
      webCard?.userName ?? '',
      profile.id,
      profile.webCardId,
      profile.contactCard ?? {},
      webCard?.commonInformation,
    );
  },
  webCard: async (profile, _, { loaders }) => {
    const webCard = await loaders.WebCard.load(profile.webCardId);

    if (!webCard) throw new Error(ERRORS.GRAPHQL_ERROR);
    return webCard;
  },
};
