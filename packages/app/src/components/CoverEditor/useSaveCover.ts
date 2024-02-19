import { isEqual } from 'lodash';
import { useCallback, useState } from 'react';
import { useIntl } from 'react-intl';
import { Platform } from 'react-native';
import * as mime from 'react-native-mime-types';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import { graphql, useFragment, useMutation } from 'react-relay';
import { Observable } from 'relay-runtime';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import { waitTime } from '@azzapp/shared/asyncHelpers';
import {
  COVER_MAX_HEIGHT,
  COVER_MAX_WIDTH,
  COVER_VIDEO_BITRATE,
} from '@azzapp/shared/coverHelpers';
import { encodeMediaId } from '@azzapp/shared/imagesHelpers';
import { combineMultiUploadProgresses } from '@azzapp/shared/networkHelpers';
import {
  exportLayersToImage,
  exportLayersToVideo,
  getFilterUri,
} from '#components/gpu';
import { getFileName } from '#helpers/fileHelpers';
import { addLocalCachedMediaFile, isPNG } from '#helpers/mediaHelpers';
import { uploadMedia, uploadSign } from '#helpers/MobileWebAPI';
import useLatestCallback from '#hooks/useLatestCallback';
import type { EditionParameters } from '#components/gpu';
import type { ExportImageOptions } from '#components/gpu/GPUHelpers';
import type { useSaveCover_webCard$key } from '#relayArtifacts/useSaveCover_webCard.graphql';
import type {
  SaveCoverInput,
  useSaveCoverMutation,
} from '#relayArtifacts/useSaveCoverMutation.graphql';
import type {
  CoverStyleData,
  MaskMedia,
  SourceMedia,
} from './coverEditorTypes';
import type { ColorPalette } from '@azzapp/shared/cardHelpers';

const useSaveCover = (
  webCard: useSaveCover_webCard$key | null,
  onCoverSaved: () => void,
) => {
  const onCoverSavedInner = useLatestCallback(onCoverSaved);
  const { id: webCardId, cardCover } = useFragment(
    graphql`
      fragment useSaveCover_webCard on WebCard {
        id
        cardCover {
          mediaParameters
          mediaFilter
          sourceMedia {
            id
          }
          segmented
        }
      }
    `,
    webCard,
  ) ?? { cardCover: null };

  const [commit] = useMutation<useSaveCoverMutation>(graphql`
    mutation useSaveCoverMutation($saveCoverInput: SaveCoverInput!) {
      saveCover(input: $saveCoverInput) {
        webCard {
          id
          ...CoverRenderer_webCard
          ...useSaveCover_webCard
          cardCover {
            media {
              id
            }
          }
        }
      }
    }
  `);

  const intl = useIntl();

  const [progressIndicator, setProgressIndicator] =
    useState<Observable<number> | null>(null);

  const saveCover = useCallback(
    async (
      title: string | null,
      subTitle: string | null,
      coverStyle: CoverStyleData,
      sourceMedia: SourceMedia,
      maskMedia: MaskMedia | null | undefined,
      mediaCropParameters: EditionParameters | null | undefined,
      colorPalette: ColorPalette,
      otherColors: readonly string[],
    ) => {
      if (!webCardId) {
        return;
      }
      setProgressIndicator(Observable.from(0));

      let saveCoverInput: SaveCoverInput;
      let mediaPath: string | null = null;

      const mediaParameters = {
        ...coverStyle.mediaParameters,
        ...mediaCropParameters,
      };

      try {
        saveCoverInput = {
          webCardId,
          backgroundId: coverStyle.background?.id ?? null,
          backgroundColor: coverStyle.backgroundColor,
          backgroundPatternColor: coverStyle.backgroundPatternColor,
          foregroundId: coverStyle.foreground?.id ?? null,
          foregroundColor: coverStyle.foregroundColor,
          mediaFilter: coverStyle.mediaFilter,
          mediaAnimation: coverStyle.mediaAnimation,
          mediaParameters,
          segmented: coverStyle.segmented,
          subTitle: subTitle ?? null,
          subTitleStyle: coverStyle.subTitleStyle,
          textOrientation: coverStyle.textOrientation,
          textPosition: coverStyle.textPosition,
          textAnimation: coverStyle.textAnimation,
          title,
          titleStyle: coverStyle.titleStyle,
        };

        const shouldRecreateMedia =
          !cardCover ||
          sourceMedia?.id == null ||
          sourceMedia?.id !== cardCover?.sourceMedia?.id ||
          coverStyle?.segmented !== cardCover?.segmented ||
          cardCover?.mediaFilter !== coverStyle?.mediaFilter ||
          !isEqual(cardCover?.mediaParameters, mediaParameters);

        if (shouldRecreateMedia) {
          if (sourceMedia.kind === 'video' && Platform.OS === 'android') {
            // on Android we need to be sure that the player is released to avoid memory overload
            await waitTime(50);
          }

          const size = {
            width: COVER_MAX_WIDTH,
            height: COVER_MAX_HEIGHT,
          };
          const isSegmented = coverStyle.segmented && maskMedia != null;
          const layerOptions = {
            parameters: mediaParameters,
            maskUri: isSegmented ? maskMedia?.uri ?? null : null,
            lutFilterUri: getFilterUri(coverStyle.mediaFilter),
          };
          if (sourceMedia.kind === 'image') {
            let exportOptions: ExportImageOptions = {
              size,
              format: 'auto',
              quality: 95,
            };
            if (isSegmented) {
              exportOptions = {
                size,
                format: 'png',
              };
            }
            mediaPath = await exportLayersToImage({
              ...exportOptions,
              layers: [
                {
                  kind: 'image',
                  uri: sourceMedia.rawUri ?? sourceMedia.uri,
                  ...layerOptions,
                },
              ],
            });
          } else {
            mediaPath = await exportLayersToVideo({
              size,
              bitRate: COVER_VIDEO_BITRATE,
              removeSound: true,
              layers: [
                {
                  kind: 'video',
                  uri: sourceMedia.rawUri ?? sourceMedia.uri,
                  ...layerOptions,
                },
              ],
            });
          }
        }

        const mediaToUploads: Array<{
          uri: string;
          kind: 'image' | 'video';
        } | null> = [
          !sourceMedia.id ? sourceMedia : null,
          maskMedia && !maskMedia.id
            ? { uri: maskMedia.uri, kind: 'image' }
            : null,
          mediaPath
            ? {
                uri: `file://${mediaPath}`,
                kind: sourceMedia.kind,
              }
            : null,
        ];

        if (Object.values(mediaToUploads).some(media => !!media)) {
          const uploadInfos = await Promise.all(
            mediaToUploads.map(async media =>
              media
                ? {
                    media,
                    ...(await uploadSign({
                      kind: media.kind,
                      target: media.uri === mediaPath ? 'cover' : 'coverSource',
                    })),
                  }
                : null,
            ),
          );
          const uploads = uploadInfos.map(uploadInfos => {
            if (!uploadInfos) {
              return null;
            }
            const { uploadURL, uploadParameters, media } = uploadInfos;
            const fileName = getFileName(media.uri);
            return uploadMedia(
              {
                name: fileName,
                uri: media.uri,
                type:
                  mime.lookup(fileName) || media.kind === 'image'
                    ? isPNG(media.uri)
                      ? 'image/png'
                      : 'image/jpeg'
                    : 'video/mp4',
              } as any,
              uploadURL,
              uploadParameters,
            );
          });

          setProgressIndicator(
            combineMultiUploadProgresses(
              convertToNonNullArray(uploads.map(upload => upload?.progress)),
            ),
          );

          const [sourceMediaId, maskMediaId, mediaId] = await Promise.all(
            uploads.map(upload =>
              upload?.promise.then(({ public_id, resource_type }) => {
                return encodeMediaId(public_id, resource_type);
              }),
            ),
          );

          if (sourceMediaId) {
            saveCoverInput.sourceMediaId = sourceMediaId;
          } else {
            saveCoverInput.sourceMediaId = sourceMedia?.id ?? null;
          }
          if (maskMediaId) {
            saveCoverInput.maskMediaId = maskMediaId;
          }
          if (mediaId) {
            saveCoverInput.mediaId = mediaId;
          }
        }
      } catch (error) {
        console.error(error);
        setProgressIndicator(null);
        Toast.show({
          type: 'error',
          text1: intl.formatMessage({
            defaultMessage: 'Error while saving your cover, please try again.',
            description: 'Error toast message when saving cover fails.',
          }),
        });
        return;
      }

      saveCoverInput.cardColors = {
        webCardId,
        primary: colorPalette.primary,
        dark: colorPalette.dark,
        light: colorPalette.light,
        otherColors,
      };

      commit({
        variables: {
          saveCoverInput,
        },
        onCompleted: response => {
          if (mediaPath) {
            const mediaId = response.saveCover.webCard.cardCover?.media?.id;
            if (mediaId) {
              addLocalCachedMediaFile(
                mediaId,
                sourceMedia.kind,
                `file://${mediaPath}`,
              );
            }
          }
          onCoverSavedInner();
        },
        onError: error => {
          console.error(error);
          Toast.show({
            type: 'error',
            text1: intl.formatMessage({
              defaultMessage:
                'Error while saving your cover, please try again.',
              description: 'Error toast message when saving cover fails.',
            }),
          });

          setProgressIndicator(null);
        },
      });
    },
    [webCardId, commit, cardCover, intl, onCoverSavedInner],
  );

  return {
    saveCover,
    progressIndicator,
  };
};

export default useSaveCover;
