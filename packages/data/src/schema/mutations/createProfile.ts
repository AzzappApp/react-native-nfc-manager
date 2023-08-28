/* eslint-disable @typescript-eslint/ban-ts-comment */
import { fromGlobalId } from 'graphql-relay';
import ERRORS from '@azzapp/shared/errors';
import { isValidUserName } from '@azzapp/shared/stringHelpers';
import {
  getCompanyActivitiesByProfileCategory,
  getProfileCategoryById,
} from '#domains';
import {
  buildDefaultContactCard,
  createProfile,
  getProfileByUserName,
} from '#domains/profiles';
import type { MutationResolvers } from '#schema/__generated__/types';
import type { GraphQLContext } from '../GraphQLContext';

const createProfileMutation: MutationResolvers['createProfile'] = async (
  _,
  { input },
  { auth, loaders }: GraphQLContext,
) => {
  const { userId } = auth;
  if (!userId) {
    throw new Error(ERRORS.UNAUTORIZED);
  }

  const {
    userName,
    firstName,
    lastName,
    profileCategoryId: graphqlProfileCategoryId,
    companyActivityId: graphqlCompanyActivityId,
    companyName,
  } = input;

  const { id: profileCategoryId, type } = fromGlobalId(
    graphqlProfileCategoryId,
  );
  if (type !== 'ProfileCategory') {
    throw new Error(ERRORS.INVALID_REQUEST);
  }
  const profileCategory = await getProfileCategoryById(profileCategoryId);
  if (!profileCategory) {
    throw new Error(ERRORS.INVALID_REQUEST);
  }

  let companyActivityId: string | null = null;
  if (graphqlCompanyActivityId) {
    const { id, type } = fromGlobalId(graphqlCompanyActivityId);
    if (type !== 'CompanyActivity') {
      throw new Error(ERRORS.INVALID_REQUEST);
    }
    companyActivityId = id;
    const profileCategoryActivities =
      await getCompanyActivitiesByProfileCategory(profileCategoryId);
    if (
      !profileCategoryActivities.find(
        ({ id: activityId }) => activityId === companyActivityId,
      )
    ) {
      throw new Error(ERRORS.INVALID_REQUEST);
    }
  }

  if (!isValidUserName(userName)) {
    throw new Error(ERRORS.INVALID_REQUEST);
  }

  if (await getProfileByUserName(userName)) {
    throw new Error(ERRORS.USERNAME_ALREADY_EXISTS);
  }

  const inputProfile = {
    userName,
    userId,
    firstName: firstName ?? null,
    lastName: lastName ?? null,
    profileKind: profileCategory.profileKind,
    profileCategoryId,
    companyActivityId: companyActivityId ?? null,
    companyName: companyName ?? null,
  };

  const contactCard = await buildDefaultContactCard(inputProfile);

  try {
    const profileId = await createProfile({ ...inputProfile, contactCard });
    const profile = await loaders.Profile.load(profileId);
    if (!profile) {
      throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
    }
    return { profile };
  } catch (error) {
    throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
  }
};

export default createProfileMutation;
