/* eslint-disable @typescript-eslint/no-confusing-void-expression */
import type { CardCoverResolvers } from './__generated__/types';

export const CardCover: CardCoverResolvers = {
  title: profile => profile.coverTitle ?? null,
  titleStyle: profile => profile.coverData?.titleStyle ?? null,
  subTitle: profile => profile.coverSubTitle ?? null,
  subTitleStyle: profile => profile.coverData?.subTitleStyle ?? null,
  textOrientation: profile => profile.coverData?.textOrientation ?? null,
  textPosition: profile => profile.coverData?.textPosition ?? null,
  media: async (profile, _, { mediaLoader }) =>
    profile.coverData?.mediaId
      ? mediaLoader.load(profile.coverData.mediaId)
      : null,
  sourceMedia: async (profile, _, { mediaLoader }) =>
    profile.coverData?.sourceMediaId
      ? mediaLoader.load(profile.coverData.sourceMediaId)
      : null,
  maskMedia: async (profile, _, { mediaLoader }) =>
    profile.coverData?.maskMediaId
      ? mediaLoader.load(profile.coverData.maskMediaId)
      : null,
  mediaFilter: profile => profile.coverData?.mediaFilter ?? null,
  mediaParameters: profile => profile.coverData?.mediaParameters ?? null,
  textPreviewMedia: async (profile, _, { mediaLoader }) =>
    profile.coverData?.textPreviewMediaId
      ? mediaLoader.load(profile.coverData.textPreviewMediaId)
      : null,
  background: async (profile, _, { staticMediaLoader }) =>
    profile.coverData?.backgroundId
      ? staticMediaLoader.load(profile.coverData.backgroundId)
      : null,
  backgroundColor: profile => profile.coverData?.backgroundColor ?? null,
  backgroundPatternColor: profile =>
    profile.coverData?.backgroundPatternColor ?? null,
  foreground: async (profile, _, { staticMediaLoader }) =>
    profile.coverData?.foregroundId
      ? staticMediaLoader.load(profile.coverData.foregroundId)
      : null,
  foregroundColor: profile => profile.coverData?.foregroundColor ?? null,
  segmented: profile => profile.coverData?.segmented ?? false,
  merged: profile => profile.coverData?.merged ?? false,
};
