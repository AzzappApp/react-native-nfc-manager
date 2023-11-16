import { isEqual } from 'lodash';
import { useCallback, useState } from 'react';
import { useIntl } from 'react-intl';
import * as mime from 'react-native-mime-types';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import { graphql, useFragment, useMutation } from 'react-relay';
import { Observable } from 'relay-runtime';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import {
  COVER_MAX_HEIGHT,
  COVER_MAX_WIDTH,
  COVER_VIDEO_BITRATE,
} from '@azzapp/shared/coverHelpers';
import { encodeMediaId } from '@azzapp/shared/imagesHelpers';
import { combineLatest } from '@azzapp/shared/observableHelpers';
import {
  FILTERS,
  exportLayersToImage,
  exportLayersToVideo,
  extractLayoutParameters,
  isFilter,
} from '#components/gpu';
import { getFileName } from '#helpers/fileHelpers';
import { addLocalCachedMediaFile, isPNG } from '#helpers/mediaHelpers';
import { uploadMedia, uploadSign } from '#helpers/MobileWebAPI';
import useLatestCallback from '#hooks/useLatestCallback';
import type { EditionParameters } from '#components/gpu';
import type { ExportImageOptions } from '#components/gpu/GPUHelpers';
import type {
  CoverStyleData,
  MaskMedia,
  SourceMedia,
} from './coverEditorTypes';
import type { useSaveCover_profile$key } from '@azzapp/relay/artifacts/useSaveCover_profile.graphql';
import type {
  SaveCoverInput,
  useSaveCoverMutation,
} from '@azzapp/relay/artifacts/useSaveCoverMutation.graphql';
import type { ColorPalette } from '@azzapp/shared/cardHelpers';

const useSaveCover = (
  profile: useSaveCover_profile$key | null,
  onCoverSaved: () => void,
) => {
  const onCoverSavedInner = useLatestCallback(onCoverSaved);
  const { cardCover } = useFragment(
    graphql`
      fragment useSaveCover_profile on Profile {
        cardCover {
          mediaParameters
          mediaFilter
          sourceMedia {
            id
          }
          segmented
          merged
        }
      }
    `,
    profile,
  ) ?? { cardCover: null };

  const [commit] = useMutation<useSaveCoverMutation>(graphql`
    mutation useSaveCoverMutation($saveCoverInput: SaveCoverInput!) {
      saveCover(input: $saveCoverInput) {
        profile {
          id
          ...CoverRenderer_profile
          ...useSaveCover_profile
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
      maskMedia: MaskMedia | null,
      mediaCropParameters: EditionParameters,
      sourceMedia: SourceMedia,
      colorPalette: ColorPalette,
      otherColors: readonly string[],
    ) => {
      setProgressIndicator(Observable.from(0));

      let saveCoverInput: SaveCoverInput;
      let mediaPath: string | null = null;

      const mediaParameters = {
        ...extractLayoutParameters(coverStyle.mediaParameters)[1],
        ...mediaCropParameters,
      };
      try {
        saveCoverInput = {
          backgroundId: coverStyle.background?.id ?? null,
          backgroundColor: coverStyle.backgroundColor,
          backgroundPatternColor: coverStyle.backgroundPatternColor,
          foregroundId: coverStyle.foreground?.id ?? null,
          foregroundColor: coverStyle.foregroundColor,
          mediaFilter: coverStyle.mediaFilter,
          mediaParameters,
          merged: coverStyle.merged,
          segmented: coverStyle.segmented,
          subTitle: subTitle ?? null,
          subTitleStyle: coverStyle.subTitleStyle,
          textOrientation: coverStyle.textOrientation,
          textPosition: coverStyle.textPosition,
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
          const size = {
            width: COVER_MAX_WIDTH,
            height: COVER_MAX_HEIGHT,
          };
          const isSegmented = coverStyle.segmented && maskMedia != null;
          const layerOptions = {
            parameters: mediaParameters,
            maskUri: isSegmented ? maskMedia?.uri ?? null : null,
            lutFilterUri: isFilter(coverStyle.mediaFilter)
              ? FILTERS[coverStyle.mediaFilter]
              : null,
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
                      : 'image/jpg'
                    : 'video/mp4',
              } as any,
              uploadURL,
              uploadParameters,
            );
          });

          const observables = convertToNonNullArray(
            uploads.map(upload => upload?.progress),
          );
          setProgressIndicator(
            combineLatest(observables).map(
              progresses =>
                progresses.reduce((a, b) => a + b, 0) / progresses.length,
            ),
          );

          const [sourceMediaId, maskMediaId, mediaId] = await Promise.all(
            uploads.map(
              upload =>
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
            const mediaId = response.saveCover.profile.cardCover?.media?.id;
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
    [commit, cardCover, onCoverSavedInner, intl],
  );

  return {
    saveCover,
    progressIndicator,
  };
};

export default useSaveCover;
