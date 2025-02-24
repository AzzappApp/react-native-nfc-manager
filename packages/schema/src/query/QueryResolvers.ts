import * as Sentry from '@sentry/nextjs';
import latinize from 'latinize';
import {
  getRedirectWebCardByUserName,
  getWebCardByUserName,
  getWebCardCategories,
  getWebCardByUserNameWithRedirection,
  deleteRedirection,
  getWebCardById,
  getWebCardByUserNamePrefixWithRedirection,
  pickRandomPredefinedCover,
} from '@azzapp/data';
import { getSessionInfos } from '#GraphQLContext';
import { userLoader } from '#loaders';
import { checkWebCardProfileAdminRight } from '#helpers/permissionsHelpers';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import { isUserNameAvailable } from '#helpers/webCardHelpers';
import { fetchNode } from './NodeResolvers';
import type { QueryResolvers } from '#/__generated__/types';

export const Query: QueryResolvers = {
  currentUser: async _root => {
    const { userId } = getSessionInfos();
    if (!userId) {
      return null;
    }
    return userLoader.load(userId);
  },

  node: (_, { id }) => fetchNode(id),
  nodes: (_, { ids }) => Promise.all(ids.map(id => fetchNode(id))),

  webCardCategories: async () => getWebCardCategories(),

  webCardParameters: () => ({
    //use a single source of truth for settings. Those settings can also be dependant on vip/premium status
    userNameChangeFrequencyDay: USERNAME_CHANGE_FREQUENCY_DAY,
  }),

  webCard: async (_, { userName }) =>
    getWebCardByUserNameWithRedirection(userName),

  userNameAvailable: async (_, { userName }) => {
    const profile = await getWebCardByUserName(userName);
    const redirection = await getRedirectWebCardByUserName(userName);
    if (redirection.length === 0 && !profile) {
      return true;
    } else if (redirection.length > 0 && !profile) {
      //check if redirection is passed
      const currentRedirection = redirection[0];
      if (currentRedirection.expiresAt < new Date()) {
        await deleteRedirection(redirection[0].fromUserName);
        return true;
      }
    }
    return false;
  },
  isUserNameAvailable: async (_: any, { userName }: { userName: string }) => {
    return isUserNameAvailable(userName);
  },
  getProposedUserName: async (_, { webcardId: inputWebCardId }) => {
    const webCardId = fromGlobalIdWithType(inputWebCardId, 'WebCard');
    await checkWebCardProfileAdminRight(webCardId);

    const profile = await getWebCardById(webCardId);
    if (!profile) {
      // should never happen
      return null;
    }
    // latinize will allow to replace é by e or ô by o
    const profileName = latinize(
      profile.webCardKind === 'business'
        ? profile.companyName || ''
        : (profile.firstName || '') + (profile.lastName || ''),
    )
      .replace(/[^0-9a-z_-]/gi, '')
      .toLocaleLowerCase();

    if (!profileName) {
      // should never happen
      return null;
    }

    // profileName;
    const availability = await isUserNameAvailable(profileName);
    if (availability.available) {
      return profileName;
    }

    const likeUsernames = (
      await getWebCardByUserNamePrefixWithRedirection(profileName)
    ).map(l => l?.toLowerCase());

    let suffix: number = 0;
    let i = 0;
    const profileNameAvailable = false;

    while (!profileNameAvailable && i < 1000) {
      if (!likeUsernames.includes(`${profileName}${suffix}`)) {
        break;
      }
      suffix += 1;
      i += 1;
    }
    if (i === 1000) {
      // This is a security check to avoid infinite loop.
      Sentry.captureException(
        `getProposedUserName reach 1000 while searching for ${profileName} webCardId: ${inputWebCardId}`,
      );
      return null;
    }
    return profileName + suffix;
  },
  pickRandomPredefinedCover: async () => {
    const { mediaId } = await pickRandomPredefinedCover();

    return { media: mediaId, assetKind: 'cover' };
  },
};

const USERNAME_CHANGE_FREQUENCY_DAY = parseInt(
  process.env.USERNAME_CHANGE_FREQUENCY_DAY ?? '1',
  10,
);
