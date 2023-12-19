import { GraphQLError } from 'graphql';
import { z } from 'zod';
import {
  DEFAULT_COVER_CONTENT_ORTIENTATION,
  DEFAULT_COVER_CONTENT_POSITION,
  DEFAULT_COVER_FONT_FAMILY,
  DEFAULT_COVER_FONT_SIZE,
  DEFAULT_COVER_TEXT_COLOR,
} from '@azzapp/shared/coverHelpers';
import ERRORS from '@azzapp/shared/errors';
import { isEditor } from '@azzapp/shared/profileHelpers';
import {
  checkMedias,
  db,
  getProfilesPosts,
  referencesMedias,
  updateWebCard,
} from '#domains';
import type { WebCard } from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const saveCover: MutationResolvers['saveCover'] = async (
  _,
  { input },
  { auth, cardUsernamesToRevalidate, postsToRevalidate, loaders },
) => {
  const { profileId } = auth;
  if (!profileId) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  const profile = await loaders.Profile.load(profileId);

  if (!profile || !isEditor(profile.profileRole)) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const oldMedias: Array<string | null> = [];

  const newMedias: string[] = [];

  const webCard = await loaders.WebCard.load(profile.webCardId);

  if (!webCard) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const validator = webCard.coverData ? updateValidator : creationValidator;

  if (!validator.safeParse(input).success) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  if (input.mediaId) {
    oldMedias.push(webCard.coverData?.mediaId ?? null);
    newMedias.push(input.mediaId);
  }

  if (input.sourceMediaId) {
    oldMedias.push(webCard.coverData?.sourceMediaId ?? null);
    newMedias.push(input.sourceMediaId);
  }

  if (input.maskMediaId) {
    oldMedias.push(webCard.coverData?.maskMediaId ?? null);
    newMedias.push(input.maskMediaId);
  }

  let updatedWebCard = {
    ...webCard,
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
      const updates: Partial<WebCard> = {
        lastCardUpdate: new Date(),
      };
      const { title, subTitle, ...coverData } = input;
      let hasUpdates = false;
      if (title != null) {
        updates.coverTitle = title;
        hasUpdates = true;
      }
      if (subTitle != null) {
        updates.coverSubTitle = subTitle;
        hasUpdates = true;
      }

      if (Object.keys(coverData).length > 0) {
        const coverDataUpdated = {
          ...webCard.coverData,
          ...coverData,
        };
        if (!coverDataUpdated.sourceMediaId || !coverDataUpdated.mediaId) {
          throw new GraphQLError(ERRORS.INVALID_REQUEST);
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
          textAnimation: coverDataUpdated.textAnimation ?? null,
          sourceMediaId: coverDataUpdated.sourceMediaId,
          segmented: coverDataUpdated.segmented ?? false,
          mediaAnimation: coverDataUpdated.mediaAnimation ?? null,
          kind: coverDataUpdated.kind ?? null,
        };
        if (input.cardColors) {
          updates.cardColors = input.cardColors;
        }
        hasUpdates = true;
      }
      if (!hasUpdates) {
        throw new GraphQLError(ERRORS.INVALID_REQUEST);
      }
      await updateWebCard(webCard.id, updates, trx);
      updatedWebCard = { ...updatedWebCard, ...updates };
    });

    cardUsernamesToRevalidate.add(webCard.userName);
    const posts = await getProfilesPosts(webCard.id);
    posts.forEach(post =>
      postsToRevalidate.add({ id: post.id, userName: webCard.userName }),
    );

    return { webCard: updatedWebCard };
  } catch (error) {
    console.log(error);
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }
};

export default saveCover;

const creationValidator = z.object({
  title: z.string().min(0).max(191).nullable(),
  mediaId: z.string(),
  sourceMediaId: z.string(),
});

const updateValidator = z.object({
  title: z.string().min(0).max(191).optional().nullable(),
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
} satisfies Partial<WebCard['coverData']>;
