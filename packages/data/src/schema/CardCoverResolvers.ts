/* eslint-disable @typescript-eslint/no-confusing-void-expression */
import type { CardCoverResolvers } from './__generated__/types';

export const CardCover: CardCoverResolvers = {
  title: profile => profile.coverTitle ?? null,
  titleStyle: profile => profile.coverData?.titleStyle ?? null,
  subTitle: profile => profile.coverSubTitle ?? null,
  subTitleStyle: profile => profile.coverData?.subTitleStyle ?? null,
  textOrientation: profile => profile.coverData?.textOrientation ?? null,
  textPosition: profile => profile.coverData?.textPosition ?? null,
  media: profile => profile.coverData?.mediaId ?? null,
  sourceMedia: profile => profile.coverData?.sourceMediaId ?? null,
  maskMedia: profile => profile.coverData?.maskMediaId ?? null,
  mediaFilter: profile => profile.coverData?.mediaFilter ?? null,
  mediaParameters: profile => profile.coverData?.mediaParameters ?? null,
  textPreviewMedia: profile => profile.coverData?.textPreviewMediaId ?? null,
  background: async profile => profile.coverData?.backgroundId ?? null,
  backgroundColor: profile => profile.coverData?.backgroundColor ?? null,
  backgroundPatternColor: profile =>
    profile.coverData?.backgroundPatternColor ?? null,
  foreground: async profile => profile.coverData?.foregroundId ?? null,
  foregroundColor: profile => profile.coverData?.foregroundColor ?? null,
  segmented: profile => profile.coverData?.segmented ?? false,
  merged: profile => profile.coverData?.merged ?? false,
};
