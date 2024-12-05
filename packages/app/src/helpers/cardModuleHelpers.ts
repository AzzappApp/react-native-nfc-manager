import Toast from 'react-native-toast-message';
import {
  MODULE_IMAGE_MAX_WIDTH,
  MODULE_VIDEO_MAX_WIDTH,
} from '@azzapp/shared/cardModuleHelpers';
import { isDefined } from '@azzapp/shared/isDefined';
import {
  POST_VIDEO_BIT_RATE,
  POST_VIDEO_FRAME_RATE,
} from '@azzapp/shared/postHelpers';
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
import type { CardStyle } from '@azzapp/shared/cardHelpers';
import type { CardModuleColor } from '@azzapp/shared/cardModuleHelpers';
import type { TextStyle } from 'react-native';

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
) => {
  const mediaToUploads = [];

  for (const moduleMedia of cardModuleMedias) {
    const { media } = moduleMedia;
    //be sure the media need to be updated, and the uri is not online one
    if (moduleMedia.needDbUpdate && !moduleMedia.media.uri.startsWith('http')) {
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
          width: aspectRatio >= 1 ? exportWidth : exportWidth * aspectRatio,
          height: aspectRatio < 1 ? exportWidth : exportWidth / aspectRatio,
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
          });
          media.uri = localPath;
        } catch (e) {
          console.log(e);
        }
      }
      const { uploadURL, uploadParameters } = await uploadSign({
        kind: media.kind,
        target: 'module',
      });
      mediaToUploads.push({
        uri: media.uri,
        kind: media.kind,
        ...uploadMedia(
          {
            name: getFileName(media.uri),
            uri: media.uri,
            type: media.kind === 'image' ? 'image/jpeg' : 'video/mp4',
          } as any,
          uploadURL,
          uploadParameters,
        ),
      });
    } else {
      mediaToUploads.push(null);
    }
  }

  const mediasUploaded: Array<UploadedMedia | null> = [];
  for (const item of mediaToUploads) {
    if (item != null) {
      const { promise, uri, kind } = item;
      const uploadResult = await promise;
      mediasUploaded.push({
        id: uploadResult.public_id,
        kind,
        uri,
      });
    } else {
      mediasUploaded.push(null);
    }
  }

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
      if (needDbUpdate) {
        addLocalCachedMediaFile(media.id, media.kind, `file://${media.uri}`);
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
  return textStyle;
};
