import { toGlobalId } from 'graphql-relay';
import type { StatisticResolvers } from './__generated__/types';

export const Statistic: StatisticResolvers = {
  id: post => {
    return toGlobalId('Profile', post.profileId) + '-' + post.day;
  },
  day: post => {
    return post.day.toISOString();
  },
};
