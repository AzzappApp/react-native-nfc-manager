import { toGlobalId } from 'graphql-relay';
import type {
  ProfileStatisticResolvers,
  WebCardStatisticResolvers,
} from '#/__generated__/types';

export const WebCardStatistic: WebCardStatisticResolvers = {
  id: post => {
    return toGlobalId('WebCard', post.webCardId) + '-' + post.day;
  },
  day: post => {
    return post.day.toISOString();
  },
};

export const ProfileStatistic: ProfileStatisticResolvers = {
  id: post => {
    return toGlobalId('Profile', post.profileId) + '-' + post.day;
  },
  day: post => {
    return post.day.toISOString();
  },
};
