/* eslint-disable @typescript-eslint/no-confusing-void-expression */
import type { CardCoverResolvers } from './__generated__/types';

export const CardCover: CardCoverResolvers = {
  isCreated: profile => profile.coverData?.mediaId != null, // mediaId and sourceMediaId are the only required field. Some screen used the title to know if the cover exist
  title: profile => profile.coverTitle ?? null,
  titleStyle: profile => profile.coverData?.titleStyle ?? null,
  subTitle: profile => profile.coverSubTitle ?? null,
  subTitleStyle: profile => profile.coverData?.subTitleStyle ?? null,
  textOrientation: profile => profile.coverData?.textOrientation ?? null,
  textPosition: profile => profile.coverData?.textPosition ?? null,
  media: profile =>
    profile.coverData?.mediaId
      ? {
          media: profile.coverData?.mediaId,
          assetKind: 'cover',
        }
      : null,
  sourceMedia: profile =>
    profile.coverData?.sourceMediaId
      ? {
          media: profile.coverData?.sourceMediaId ?? null,
          assetKind: 'coverSource',
        }
      : null,
  maskMedia: profile =>
    profile.coverData?.maskMediaId
      ? {
          media: profile.coverData?.maskMediaId ?? null,
          assetKind: 'coverSource',
        }
      : null,
  mediaFilter: profile => profile.coverData?.mediaFilter ?? null,
  mediaParameters: profile => profile.coverData?.mediaParameters ?? null,
  background: async profile =>
    profile.coverData?.backgroundId
      ? {
          staticMedia: profile.coverData?.backgroundId,
          assetKind: 'cover',
        }
      : null,
  backgroundColor: profile => profile.coverData?.backgroundColor ?? null,
  backgroundPatternColor: profile =>
    profile.coverData?.backgroundPatternColor ?? null,
  foreground: async profile =>
    profile.coverData?.foregroundId
      ? {
          staticMedia: profile.coverData?.foregroundId,
          assetKind: 'cover',
        }
      : null,
  foregroundColor: profile => profile.coverData?.foregroundColor ?? null,
  segmented: profile => profile.coverData?.segmented ?? false,
  merged: profile => profile.coverData?.merged ?? false,
};
