/* eslint-disable @typescript-eslint/no-confusing-void-expression */
import type { CardCoverResolvers } from './__generated__/types';

export const CardCover: CardCoverResolvers = {
  title: webCard => webCard.coverTitle ?? null,
  titleStyle: webCard => webCard.coverData?.titleStyle ?? null,
  subTitle: webCard => webCard.coverSubTitle ?? null,
  subTitleStyle: webCard => webCard.coverData?.subTitleStyle ?? null,
  textOrientation: webCard => webCard.coverData?.textOrientation ?? null,
  textPosition: webCard => webCard.coverData?.textPosition ?? null,
  media: webCard =>
    webCard.coverData?.mediaId
      ? {
          media: webCard.coverData?.mediaId,
          assetKind: 'cover',
        }
      : null,
  sourceMedia: webCard =>
    webCard.coverData?.sourceMediaId
      ? {
          media: webCard.coverData?.sourceMediaId ?? null,
          assetKind: 'coverSource',
        }
      : null,
  maskMedia: webCard =>
    webCard.coverData?.maskMediaId
      ? {
          media: webCard.coverData?.maskMediaId ?? null,
          assetKind: 'coverSource',
        }
      : null,
  mediaFilter: webCard => webCard.coverData?.mediaFilter ?? null,
  mediaParameters: webCard => webCard.coverData?.mediaParameters ?? null,
  background: async webCard =>
    webCard.coverData?.backgroundId
      ? {
          staticMedia: webCard.coverData?.backgroundId,
          assetKind: 'cover',
        }
      : null,
  backgroundColor: webCard => webCard.coverData?.backgroundColor ?? null,
  backgroundPatternColor: webCard =>
    webCard.coverData?.backgroundPatternColor ?? null,
  foreground: async webCard =>
    webCard.coverData?.foregroundId
      ? {
          staticMedia: webCard.coverData?.foregroundId,
          assetKind: 'cover',
        }
      : null,
  foregroundColor: webCard => webCard.coverData?.foregroundColor ?? null,
  segmented: webCard => webCard.coverData?.segmented ?? false,
  merged: webCard => webCard.coverData?.merged ?? false,
};
