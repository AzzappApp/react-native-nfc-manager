import * as Sentry from '@sentry/react-native';
import Toast from 'react-native-toast-message';
import { splitArrayIntoChunks } from '@azzapp/shared/arrayHelpers';
import { waitTime } from '@azzapp/shared/asyncHelpers';
import {
  MODULE_IMAGE_MAX_WIDTH,
  MODULE_VIDEO_MAX_WIDTH,
} from '@azzapp/shared/cardModuleHelpers';
import { isDefined } from '@azzapp/shared/isDefined';
import { combineMultiUploadProgresses } from '@azzapp/shared/networkHelpers';
import {
  POST_VIDEO_BIT_RATE,
  POST_VIDEO_FRAME_RATE,
} from '@azzapp/shared/postHelpers';
import { isNotFalsyString, isValidUrl } from '@azzapp/shared/stringHelpers';
import { MEMORY_SIZE } from './device';
import { getFileName } from './fileHelpers';
import {
  saveTransformedImageToFile,
  getTargetFormatFromPath,
  saveTransformedVideoToFile,
} from './mediaEditions';
import { addLocalCachedMediaFile } from './mediaHelpers';
import { uploadSign, uploadMedia } from './MobileWebAPI';
import type {
  CardModuleMedia,
  CardModuleSourceMedia,
} from '#components/cardModules/cardModuleEditorType';
import type { useRouter } from '#components/NativeRouter';
import type { ModuleKindAndVariant } from './webcardModuleHelpers';
import type { CardStyle } from '@azzapp/shared/cardHelpers';
import type { CardModuleColor } from '@azzapp/shared/cardModuleHelpers';
import type { TextStyle } from 'react-native';
import type { Observable } from 'relay-runtime';

export const getCardModuleMediaKind = (media: CardModuleSourceMedia) => {
  //put it first because of ts error (stupid) about id does not exist on type never
  const { id } = media;
  if (media.kind) {
    return media.kind;
  }
  if (id.startsWith('i_')) {
    return 'image';
  } else if (id.startsWith('v_')) {
    return 'video';
  }
  return 'image';
};

type UploadedMedia = {
  id: string;
  kind: 'image' | 'video';
  uri: string;
};

export const handleUploadCardModuleMedia = async (
  cardModuleMedias: CardModuleMedia[],
  updateProcessedMedia: (args: { total: number; value: number }) => void,
  updateUploadIndicator: (arg: Observable<number>) => void,
) => {
  let value = 0;
  //first determine total because some media don't need any treatment
  const processingMediaTotal = cardModuleMedias.filter(
    a => a.needDbUpdate && !a.media.uri.startsWith('http'),
  ).length;

  const chunks = splitArrayIntoChunks(
    cardModuleMedias,
    MEMORY_SIZE < 6 ? 2 : 5,
  );

  const mediaToUploads: Array<{
    uri: string;
    kind: 'image' | 'video';
  } | null> = [];

  for (const chunk of chunks) {
    mediaToUploads.push(
      ...(await Promise.all(
        chunk.map(async moduleMedia => {
          const { media: sourceMedia } = moduleMedia;
          const media = { ...sourceMedia };
          //be sure the media need to be updated, and the uri is not online one
          if (
            moduleMedia.needDbUpdate &&
            !moduleMedia.media.uri.startsWith('http')
          ) {
            if (media.kind === 'image') {
              const exportWidth = Math.min(MODULE_IMAGE_MAX_WIDTH, media.width);
              const exportHeight = (exportWidth / media.width) * media.height;
              const localPath = await saveTransformedImageToFile({
                uri: media.uri,
                resolution: { width: exportWidth, height: exportHeight },
                format: getTargetFormatFromPath(media.uri),
                quality: 95,
                filter: media.filter,
                editionParameters: media.editionParameters,
              });
              media.uri = localPath;
            } else {
              const exportWidth = Math.min(MODULE_VIDEO_MAX_WIDTH, media.width);
              const exportHeight = (exportWidth / media.width) * media.height;
              const aspectRatio = exportWidth / exportHeight;
              const resolution = {
                width:
                  aspectRatio >= 1 ? exportWidth : exportWidth * aspectRatio,
                height:
                  aspectRatio < 1 ? exportWidth : exportWidth / aspectRatio,
              };
              try {
                const localPath = await saveTransformedVideoToFile({
                  video: {
                    uri: media.uri,
                    width: exportWidth,
                    height: exportHeight,
                    rotation: media.rotation ?? 0,
                  },
                  resolution,
                  bitRate: POST_VIDEO_BIT_RATE,
                  frameRate: POST_VIDEO_FRAME_RATE,
                  duration: media.timeRange?.duration,
                  startTime: media.timeRange?.startTime,
                  filter: media.filter,
                  editionParameters: media.editionParameters,
                  maxDecoderResolution: MODULE_VIDEO_MAX_WIDTH,
                });
                media.uri = localPath;
              } catch (e) {
                Sentry.captureException(e);
                console.error(e);
              }
            }

            value += 1;
            updateProcessedMedia({ total: processingMediaTotal, value });
            return {
              uri: media.uri,
              kind: media.kind,
            };
          } else {
            return null;
          }
        }),
      )),
    );
  }

  const mediaUploading = await Promise.all(
    mediaToUploads
      .filter(item => item !== null)
      .map(async ({ uri, kind }) => {
        const { uploadURL, uploadParameters } = await uploadSign({
          kind,
          target: 'module',
        });

        return {
          kind,
          uri,
          ...uploadMedia(
            {
              name: getFileName(uri),
              uri,
              type: kind === 'image' ? 'image/jpeg' : 'video/mp4',
            } as any,
            uploadURL,
            uploadParameters,
          ),
        };
      }),
  );

  updateUploadIndicator(
    combineMultiUploadProgresses(
      mediaUploading
        .filter(item => item !== null)
        .map(({ progress }) => progress),
    ),
  );
  await waitTime(1);

  const mediasUploaded = await Promise.all(
    mediaUploading.map(async item => {
      if (item != null) {
        const { promise, uri, kind } = item;
        const uploadResult = await promise;
        return {
          id: uploadResult.public_id,
          kind,
          uri,
        };
      }
      return null;
    }),
  );

  return cardModuleMedias.map((moduleMedia, index) => {
    if (moduleMedia.needDbUpdate) {
      return {
        ...moduleMedia,
        media: mediasUploaded[index] ?? moduleMedia.media,
      };
    }
    return moduleMedia;
  });
};

export const handleOnCompletedModuleSave = (
  moduleMedias: Array<{
    media: UploadedMedia;
    title?: string;
    text?: string;
    needDbUpdate?: boolean;
  }> | null,
  router: ReturnType<typeof useRouter>,
  error: unknown,
  errorMessage?: string,
) => {
  if (error && errorMessage) {
    Toast.show({
      type: 'error',
      text1: errorMessage,
    });
    throw error;
  }
  if (moduleMedias) {
    for (let index = 0; index < moduleMedias.length; index++) {
      const { needDbUpdate, media } = moduleMedias[index];
      if (needDbUpdate && !media.uri.startsWith('http')) {
        addLocalCachedMediaFile(media.id, media.kind, media.uri);
      }
    }
  }
  router.back();
};

export const convertModuleMediaRelay = (mediaRelay: any) => {
  if (!mediaRelay) {
    return [];
  }
  return mediaRelay
    .map((moduleRelay: any) => {
      if (moduleRelay) {
        const { media, ...rest } = moduleRelay;
        return {
          media: {
            id: media.id,
            kind: media.id?.startsWith('v_') ? 'video' : 'image',
            uri: media.uri,
            thumbnail: media.thumbnail,
            smallUri: media.smallURI,
            width: media.width ?? 0,
            height: media.height ?? 0,
          },
          needDbUpdate: false,
          ...rest,
        };
      }
      return null;
    })
    .filter(isDefined);
};
/**
 * Define the title style for the new module. Based on cardModule combination
 *
 * @param {(CardStyle | null | undefined)} cardStyle
 * @param {CardModuleColor} cardModuleColor
 * @return {*}
 */
export const getTitleStyle = (
  cardStyle: CardStyle | null | undefined,
  cardModuleColor: CardModuleColor,
) => {
  const textStyle: TextStyle = {
    fontFamily: 'Arial',
    fontSize: 34,
    lineHeight: 48,
    color: cardModuleColor.title,
  };
  if (cardStyle?.titleFontFamily) {
    textStyle.fontFamily = cardStyle.titleFontFamily;
  }
  if (cardStyle?.fontSize) {
    textStyle.fontSize = cardStyle.titleFontSize;
    textStyle.lineHeight = cardStyle.titleFontSize * 1.2;
  }
  return textStyle;
};

/**
 * Define the text style for the new module. Based on cardModule combination
 *
 * @param {(CardStyle | null | undefined)} cardStyle
 * @param {CardModuleColor} cardModuleColor
 * @return {*}
 */
export const getTextStyle = (
  cardStyle: CardStyle | null | undefined,
  cardModuleColor: CardModuleColor,
) => {
  const textStyle: TextStyle = {
    fontFamily: 'Arial',
    fontSize: 16,
    color: cardModuleColor.text,
  };

  if (cardStyle?.fontFamily) {
    textStyle.fontFamily = cardStyle.fontFamily;
  }
  if (cardStyle?.fontSize) {
    textStyle.fontSize = cardStyle.fontSize;
  }
  textStyle.lineHeight = textStyle.fontSize! * 1.6;

  return textStyle;
};

/**
 * function to check if a cardModuleMedia is in error based on the module kind and variant
 * for exemple, url should be valid in case of a mediaTextLink module
 *
 */
export const hasCardModuleMediaError = (
  cardModuleMedia: CardModuleMedia,
  module: ModuleKindAndVariant,
) => {
  if (module.moduleKind === 'mediaTextLink') {
    if (isNotFalsyString(cardModuleMedia.link?.url)) {
      return !isValidUrl(cardModuleMedia.link?.url);
    }
  }
  return false;
};

export const hasCardModuleMediasError = (
  cardModuleMedias: CardModuleMedia[],
  module: ModuleKindAndVariant,
) => {
  if (cardModuleMedias?.length === 0) {
    return true;
  }
  for (const cardModuleMedia of cardModuleMedias) {
    if (hasCardModuleMediaError(cardModuleMedia, module)) {
      return true;
    }
  }
  return false;
};
