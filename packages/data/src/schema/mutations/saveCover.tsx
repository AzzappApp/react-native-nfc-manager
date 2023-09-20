import { z } from 'zod';
import {
  DEFAULT_COVER_CONTENT_ORTIENTATION,
  DEFAULT_COVER_CONTENT_POSITION,
  DEFAULT_COVER_FONT_FAMILY,
  DEFAULT_COVER_FONT_SIZE,
  DEFAULT_COVER_TEXT_COLOR,
} from '@azzapp/shared/coverHelpers';
import ERRORS from '@azzapp/shared/errors';
import { checkMedias, db, referencesMedias, updateProfile } from '#domains';
import type { Profile } from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const saveCover: MutationResolvers['saveCover'] = async (
  _,
  { input },
  { auth, loaders, cardUsernamesToRevalidate },
) => {
  const profileId = auth.profileId;
  if (!profileId) {
    throw new Error(ERRORS.UNAUTORIZED);
  }

  const profile = await loaders.Profile.load(profileId);
  if (!profile) {
    throw new Error(ERRORS.INVALID_REQUEST);
  }

  const oldMedias: Array<string | null> = [];

  const newMedias: string[] = [];

  const validator = profile.coverData ? updateValidator : creationValidator;

  if (!validator.safeParse(input).success) {
    throw new Error(ERRORS.INVALID_REQUEST);
  }

  if (input.mediaId) {
    oldMedias.push(profile.coverData?.mediaId ?? null);
    newMedias.push(input.mediaId);
  }

  if (input.sourceMediaId) {
    oldMedias.push(profile.coverData?.sourceMediaId ?? null);
    newMedias.push(input.sourceMediaId);
  }

  if (input.maskMediaId) {
    oldMedias.push(profile.coverData?.maskMediaId ?? null);
    newMedias.push(input.maskMediaId);
  }

  let updatedProfile = {
    ...profile,
    updatedAt: new Date(),
  };
  try {
    if (newMedias.length > 0) {
      await checkMedias(newMedias);
    }
    await db.transaction(async trx => {
      if (newMedias.length > 0) {
        await referencesMedias(newMedias, oldMedias, trx);
      }
      const updates: Partial<Profile> = {
        lastCardUpdate: new Date(),
      };
      const { title, subTitle, ...coverData } = input;
      let hasUpdates = false;
      if (title) {
        updates.coverTitle = title;
        hasUpdates = true;
      }
      if (subTitle) {
        updates.coverSubTitle = subTitle;
        hasUpdates = true;
      }
      if (Object.keys(coverData).length > 0) {
        const coverDataUpdated = {
          ...profile.coverData,
          ...coverData,
        };
        if (!coverDataUpdated.sourceMediaId || !coverDataUpdated.mediaId) {
          throw new Error(ERRORS.INVALID_REQUEST);
        }
        updates.coverData = {
          ...coverDataUpdated,
          titleStyle:
            coverDataUpdated.titleStyle ?? DEFAULT_COVER_DATA.titleStyle,
          subTitleStyle:
            coverDataUpdated.subTitleStyle ?? DEFAULT_COVER_DATA.subTitleStyle,
          textOrientation:
            coverDataUpdated.textOrientation ??
            DEFAULT_COVER_DATA.textOrientation,
          textPosition:
            coverDataUpdated.textPosition ?? DEFAULT_COVER_DATA.textPosition,
          sourceMediaId: coverDataUpdated.sourceMediaId,
          merged: coverDataUpdated.merged ?? false,
          segmented: coverDataUpdated.segmented ?? false,
        };
        if (input.cardColors) {
          updates.cardColors = input.cardColors;
        }
        hasUpdates = true;
      }
      if (!hasUpdates) {
        throw new Error(ERRORS.INVALID_REQUEST);
      }
      await updateProfile(profileId, updates, trx);
      updatedProfile = { ...updatedProfile, ...updates };
    });

    cardUsernamesToRevalidate.add(profile.userName);
    return { profile: updatedProfile };
  } catch (error) {
    console.log(error);
    throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
  }
};

export default saveCover;

const creationValidator = z.object({
  title: z.string().min(1).max(191),
  mediaId: z.string(),
  sourceMediaId: z.string(),
});

const updateValidator = z.object({
  title: z.string().min(1).max(191).optional(),
  mediaId: z.string().optional(),
  sourceMediaId: z.string().optional(),
});

const DEFAULT_COVER_DATA = {
  textOrientation: DEFAULT_COVER_CONTENT_ORTIENTATION,
  textPosition: DEFAULT_COVER_CONTENT_POSITION,
  titleStyle: {
    fontFamily: DEFAULT_COVER_FONT_FAMILY,
    fontSize: DEFAULT_COVER_FONT_SIZE,
    color: DEFAULT_COVER_TEXT_COLOR,
  },
  subTitleStyle: {
    fontFamily: DEFAULT_COVER_FONT_FAMILY,
    fontSize: DEFAULT_COVER_FONT_SIZE,
    color: DEFAULT_COVER_TEXT_COLOR,
  },
} satisfies Partial<Profile['coverData']>;
