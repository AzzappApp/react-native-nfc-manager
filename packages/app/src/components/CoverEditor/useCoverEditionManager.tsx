import { isEqual, mapValues, pick } from 'lodash';
import { useCallback, useMemo, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Modal, unstable_batchedUpdates } from 'react-native';
import * as mime from 'react-native-mime-types';
import Toast from 'react-native-toast-message';
import { graphql, useFragment, useMutation } from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import {
  DEFAULT_COLOR_LIST,
  DEFAULT_COLOR_PALETTE,
} from '@azzapp/shared/cardHelpers';
import {
  COVER_MAX_HEIGHT,
  COVER_MAX_VIDEO_DURATTION,
  COVER_MAX_WIDTH,
  COVER_RATIO,
  COVER_SOURCE_MAX_IMAGE_DIMENSION,
  COVER_SOURCE_MAX_VIDEO_DIMENSION,
  COVER_VIDEO_BITRATE,
  DEFAULT_COVER_SUBTITLE_TEXT_STYLE,
  DEFAULT_COVER_TEXT_STYLE,
  textOrientationOrDefaut,
  textPositionOrDefaut,
} from '@azzapp/shared/coverHelpers';
import { encodeMediaId } from '@azzapp/shared/imagesHelpers';
import { combineLatest } from '@azzapp/shared/observableHelpers';
import {
  exportImage,
  type EditionParameters,
  exportVideo,
  extractLayoutParameters,
} from '#components/gpu';
import ImagePicker, {
  ImagePickerCardMediaWrapper,
  SelectImageStepWithFrontCameraByDefault,
  VideoTimeRangeStep,
} from '#components/ImagePicker';
import { addLocalCachedMediaFile } from '#components/medias';
import { getFileName } from '#helpers/fileHelpers';
import { downScaleImage, isPNG, segmentImage } from '#helpers/mediaHelpers';
import { uploadMedia, uploadSign } from '#helpers/MobileWebAPI';
import Button from '#ui/Button';
import Container from '#ui/Container';
import Icon from '#ui/Icon';
import Text from '#ui/Text';
import UploadProgressModal from '#ui/UploadProgressModal';
import CoverEditorCropModal from './CoverEditorCropModal';
import type { ExportImageOptions } from '#components/gpu/GPUNativeMethods';
import type { ImagePickerResult } from '#components/ImagePicker';
import type { TimeRange } from '#components/ImagePicker/imagePickerTypes';
import type { ColorPalette, CoverStyleData } from './coverEditorTypes';
import type { useCoverEditionManager_profile$key } from '@azzapp/relay/artifacts/useCoverEditionManager_profile.graphql';
import type {
  SaveCoverInput,
  useCoverEditionManagerMutation,
} from '@azzapp/relay/artifacts/useCoverEditionManagerMutation.graphql';
import type { Observable } from 'relay-runtime';

export type CoverData = {
  title: string | null;
  subTitle: string | null;
  sourceMedia: {
    id?: string;
    uri: string;
    kind: 'image' | 'video';
    width: number;
    height: number;
  } | null;
  maskMedia: {
    id?: string;
    uri: string;
    source?: string;
  } | null;
  mediaCropParameter: Pick<
    EditionParameters,
    'cropData' | 'orientation' | 'roll'
  > | null;
  coverStyle: CoverStyleData | null;
};

type UserCoverEditorUpdaterOptions = {
  profile: useCoverEditionManager_profile$key | null;
  initialData: CoverData | null;
  initialColorPalette: ColorPalette | null;
  initialTemplateKind?: 'image' | 'mixed' | 'video';
  onCoverSaved: () => void;
};

const useCoverEditionManager = ({
  profile: profileKey,
  initialData,
  initialColorPalette,
  initialTemplateKind = 'mixed',
  onCoverSaved,
}: UserCoverEditorUpdaterOptions) => {
  const profile = useFragment(
    graphql`
      fragment useCoverEditionManager_profile on Profile {
        id
        profileKind
        firstName
        lastName
        companyName
        companyActivity {
          label
        }
        cardCover {
          title
          subTitle
          mediaParameters
          mediaFilter
          sourceMedia {
            __typename
            id
            uri
            width
            height
          }
          maskMedia {
            id
            uri
          }
          background {
            id
            uri
            resizeMode
          }
          foreground {
            id
            uri
          }
          backgroundColor
          backgroundPatternColor
          foregroundColor
          segmented
          merged
          textOrientation
          textPosition
          titleStyle {
            fontFamily
            fontSize
            color
          }
          subTitleStyle {
            fontFamily
            fontSize
            color
          }
        }
        cardColors {
          primary
          light
          dark
          otherColors
        }
      }
    `,
    profileKey,
  );

  const cardCover = profile?.cardCover;
  const cardColors = profile?.cardColors;

  // #region Cover data
  const [title, setTitle] = useState<string | null>(() => {
    if (initialData) {
      return initialData?.title;
    }
    if (cardCover?.title) {
      return cardCover?.title;
    }
    if (profile?.profileKind === 'business') {
      return profile?.companyName;
    }
    return profile?.firstName ?? null;
  });

  const [subTitle, setSubTitle] = useState<string | null>(() => {
    if (initialData) {
      return initialData?.subTitle;
    }
    if (cardCover?.subTitle) {
      return cardCover?.subTitle;
    }
    if (profile?.profileKind === 'business') {
      return profile?.companyActivity?.label ?? null;
    }
    return profile?.lastName ?? null;
  });

  const [sourceMedia, setSourceMedia] = useState<
    CoverData['sourceMedia'] | null
  >(() => {
    if (initialData?.sourceMedia) {
      return initialData?.sourceMedia;
    }
    const sourceMedia = cardCover?.sourceMedia;
    if (sourceMedia) {
      return {
        id: sourceMedia.id,
        uri: sourceMedia.uri,
        kind: sourceMedia.__typename === 'MediaVideo' ? 'video' : 'image',
        width: sourceMedia.width,
        height: sourceMedia.height,
      };
    }
    return null;
  });
  const [maskMedia, setMaskMedia] = useState<CoverData['maskMedia'] | null>(
    initialData ? initialData?.maskMedia : cardCover?.maskMedia ?? null,
  );
  const [mediaCropParameter, setMediaCropParameter] = useState<
    CoverData['mediaCropParameter'] | null
  >(() => {
    if (initialData) {
      return initialData?.mediaCropParameter;
    }
    if (cardCover?.mediaParameters) {
      return extractLayoutParameters(cardCover.mediaParameters)[0];
    }
    return null;
  });

  const currentCoverStyle = useMemo<CoverStyleData | null>(
    () =>
      cardCover
        ? {
            titleStyle: cardCover.titleStyle ?? DEFAULT_COVER_TEXT_STYLE,
            subTitleStyle:
              cardCover.subTitleStyle ?? DEFAULT_COVER_SUBTITLE_TEXT_STYLE,
            textOrientation: textOrientationOrDefaut(cardCover.textOrientation),
            textPosition: textPositionOrDefaut(cardCover.textPosition),
            mediaFilter: cardCover.mediaFilter ?? null,
            mediaParameters:
              (cardCover.mediaParameters as EditionParameters) ?? null,
            background: cardCover.background ?? null,
            backgroundColor: cardCover.backgroundColor ?? '#FFF',
            backgroundPatternColor: cardCover.backgroundPatternColor ?? '#000',
            foreground: cardCover.foreground ?? null,
            foregroundColor: cardCover.foregroundColor ?? '#FFF',
            merged: cardCover.merged,
            segmented: cardCover.segmented,
          }
        : null,
    [cardCover],
  );

  const [coverStyle, setCoverStyle] = useState<CoverStyleData>(() => {
    if (initialData?.coverStyle) {
      const style = { ...initialData.coverStyle };
      if (!sourceMedia && style.segmented) {
        style.segmented = false;
      }
      return style;
    }
    return currentCoverStyle ?? DEFAULT_COVER_STYLE;
  });
  // #endregion

  // #region Media kind
  const [mediaKind, setMediaKind] = useState<'image' | 'mixed' | 'video'>(
    initialTemplateKind,
  );
  type MediaInfos = {
    sourceMedia: CoverData['sourceMedia'] | null;
    maskMedia: CoverData['maskMedia'] | null;
    mediaCropParameter: CoverData['mediaCropParameter'] | null;
  };
  const mediaInfosRef = useRef<{
    video: MediaInfos | null;
    image: MediaInfos | null;
  }>({
    video: null,
    image: null,
  });

  const updateEditedMediaKind = useCallback(
    (kind: 'image' | 'mixed' | 'video') => {
      unstable_batchedUpdates(() => {
        if (kind === 'video' && mediaKind === 'image') {
          mediaInfosRef.current.image = {
            sourceMedia,
            maskMedia,
            mediaCropParameter,
          };
          const videoInfos = mediaInfosRef.current.video;
          setSourceMedia(videoInfos?.sourceMedia ?? null);
          setMaskMedia(null);
          setMediaCropParameter(videoInfos?.mediaCropParameter ?? null);
        } else if (kind === 'image' && mediaKind === 'video') {
          mediaInfosRef.current.video = {
            sourceMedia,
            maskMedia,
            mediaCropParameter,
          };
          const imageInfos = mediaInfosRef.current.image;
          setSourceMedia(imageInfos?.sourceMedia ?? null);
          setMaskMedia(imageInfos?.maskMedia ?? null);
          setMediaCropParameter(imageInfos?.mediaCropParameter ?? null);
        }
        setMediaKind(kind);
      });
    },
    [maskMedia, mediaCropParameter, mediaKind, sourceMedia],
  );
  //#endregion

  //#region Crop mode
  const [cropMode, setCropMode] = useState(false);
  const toggleCropMode = useCallback(() => {
    setCropMode(cropMode => !cropMode);
  }, []);

  const onSaveCropData = useCallback(
    (editionParameters: EditionParameters) => {
      setMediaCropParameter(editionParameters);
      setCropMode(false);
    },
    [setMediaCropParameter],
  );
  //#endregion

  // #region Color palette
  const [colorPalette, setColorPalette] = useState<ColorPalette>(() => {
    if (initialColorPalette) {
      return initialColorPalette;
    }
    if (cardColors) {
      return pick(cardColors, 'primary', 'dark', 'light');
    }
    return DEFAULT_COLOR_PALETTE;
  });

  const [otherColors, setOtherColors] = useState<string[]>(
    cardColors?.otherColors?.slice() ?? DEFAULT_COLOR_LIST,
  );

  // #region Image picker
  // the time range is only used for video during the recomputation of
  // the source media, it is not saved in the cover
  const [timeRange, setTimeRange] = useState<TimeRange | null>(null);

  const [showImagePicker, setShowImagePicker] = useState(false);
  const openImagePicker = useCallback(() => {
    setShowImagePicker(true);
  }, []);

  const closeImagePicker = useCallback(() => {
    setShowImagePicker(false);
  }, []);

  const [mediaComputation, setMediaComputation] =
    useState<MaskComputation | null>(null);
  const [mediaComputationError, setMediaComputationError] = useState<any>(null);
  const lastComputedMedia = useRef<ImagePickerResult | null>(null);

  const startMediaComputation = useCallback(
    (result: ImagePickerResult) => {
      lastComputedMedia.current = result;
      const { uri, kind, width, height, editionParameters, timeRange } = result;
      if (mediaComputation) {
        mediaComputation.cancel();
      }
      const maxSize =
        kind === 'image'
          ? COVER_SOURCE_MAX_IMAGE_DIMENSION
          : COVER_SOURCE_MAX_VIDEO_DIMENSION;
      // TODO the bitrate/framerate of the video might be too high perhaps
      // we should also check that
      const shouldRecomputeMedia =
        width > maxSize || height > maxSize || timeRange != null;

      const shouldRecomputeMask: boolean =
        kind === 'image' && maskMedia?.source !== uri;

      if (shouldRecomputeMedia || shouldRecomputeMask) {
        const mediaComputation = createMediaComputation({
          uri,
          kind,
          width,
          height,
          editionParameters,
          timeRange,
          maxSize,
          computeMask: shouldRecomputeMask,
          downscaleMedia: shouldRecomputeMedia,
        });
        setMediaComputation(mediaComputation);

        mediaComputation.promise.then(
          result => {
            if (result === 'canceled') {
              return;
            }
            const { media, editionParameters, maskURI } = result;
            unstable_batchedUpdates(() => {
              setSourceMedia(media);
              setMediaCropParameter(
                extractLayoutParameters(editionParameters)[0],
              );
              if (maskURI) {
                setMaskMedia({ uri: maskURI, source: uri });
              }
              setMediaComputation(null);
              setTimeRange(null);
            });
          },
          error => {
            setMediaComputationError(error);
          },
        );
      } else {
        setMaskMedia(null);
      }
    },
    [maskMedia?.source, mediaComputation],
  );

  const retryMediaComputation = useCallback(() => {
    if (lastComputedMedia.current) {
      startMediaComputation(lastComputedMedia.current);
    }
  }, [startMediaComputation]);

  const onMediaSelected = (result: ImagePickerResult) => {
    unstable_batchedUpdates(async () => {
      const { uri, kind, width, height, editionParameters, timeRange } = result;
      setShowImagePicker(false);
      setSourceMedia({ uri, kind, width, height });
      setMediaCropParameter(extractLayoutParameters(editionParameters)[0]);
      setTimeRange(timeRange ?? null);
      startMediaComputation(result);
    });
  };

  // #region Cover saving
  const [saving, setSaving] = useState(false);
  const [showMediaRequiredModal, setShowMediaRequiredModal] = useState(false);
  const [uploadProgress, setUploadProgress] =
    useState<Observable<number> | null>(null);
  const onSaveRetryCount = useRef(0);

  const [commit] = useMutation<useCoverEditionManagerMutation>(graphql`
    mutation useCoverEditionManagerMutation($saveCoverInput: SaveCoverInput!) {
      saveCover(input: $saveCoverInput) {
        profile {
          id
          ...CoverRenderer_profile
          ...useCoverEditionManager_profile
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

  const onSave = useCallback(async () => {
    if (!sourceMedia) {
      setShowMediaRequiredModal(true);
      return;
    }
    setSaving(true);
    if (!coverStyle || !colorPalette) {
      // TODO invalid state, should not happens
      if (onSaveRetryCount.current >= 3) {
        // TODO
        return;
      }
      onSaveRetryCount.current++;
      setTimeout(onSave, 50);
      return;
    }
    if (mediaComputation) {
      return;
    }

    let saveCoverInput: SaveCoverInput;
    let mediaPath: string | null = null;
    const mediaParameters = {
      ...extractLayoutParameters(coverStyle.mediaParameters)[1],
      ...mediaCropParameter,
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

      const mediaStyle = [
        'mediaFilter',
        'mediaParameters',
        'merged',
        'segmented',
      ] as const;

      const shouldRecreateMedia =
        !cardCover ||
        sourceMedia?.id == null ||
        !isEqual(
          pick(currentCoverStyle, ...mediaStyle),
          pick({ ...coverStyle, mediaParameters }, ...mediaStyle),
        );

      if (shouldRecreateMedia) {
        const size = {
          width: COVER_MAX_WIDTH,
          height: COVER_MAX_HEIGHT,
        };
        const isSegmented = coverStyle.segmented && maskMedia != null;
        const layerOptions = {
          parameters: mediaParameters,
          maskUri: isSegmented ? maskMedia?.uri ?? null : null,
          filters: coverStyle.mediaFilter ? [coverStyle.mediaFilter] : null,
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
          mediaPath = await exportImage({
            ...exportOptions,
            layers: [
              {
                kind: 'image',
                uri: sourceMedia.uri,
                ...layerOptions,
              },
            ],
          });
        } else {
          mediaPath = await exportVideo({
            size,
            bitRate: COVER_VIDEO_BITRATE,
            removeSound: true,
            layers: [
              {
                kind: 'video',
                uri: sourceMedia.uri,
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
        sourceMedia && !sourceMedia.id ? sourceMedia : null,
        maskMedia && !maskMedia.id
          ? { uri: maskMedia.uri, kind: 'image' }
          : null,
        mediaPath ? { uri: mediaPath, kind: sourceMedia.kind } : null,
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
        setUploadProgress(
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
        }
        if (maskMediaId) {
          saveCoverInput.maskMediaId = maskMediaId;
        }
        if (mediaId) {
          saveCoverInput.mediaId = mediaId;
        }
      }
    } catch (error) {
      // TODO
      console.error(error);
      setUploadProgress(null);
      setSaving(false);
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
        setSaving(false);
        setUploadProgress(null);
        onCoverSaved();
      },
      onError: error => {
        console.error(error);

        Toast.show({
          type: 'error',
          text1: intl.formatMessage({
            defaultMessage: 'Error while saving your cover, please try again.',
            description: 'Error toast message when saving cover fails.',
          }),
        });
        setSaving(false);
        setUploadProgress(null);
      },
    });
  }, [
    sourceMedia,
    coverStyle,
    colorPalette,
    mediaComputation,
    mediaCropParameter,
    otherColors,
    commit,
    subTitle,
    title,
    cardCover,
    currentCoverStyle,
    maskMedia,
    onCoverSaved,
    intl,
  ]);

  const modals = (
    <>
      <Modal
        visible={showImagePicker}
        animationType="slide"
        onRequestClose={closeImagePicker}
      >
        <ImagePicker
          kind={mediaKind}
          forceAspectRatio={COVER_RATIO}
          maxVideoDuration={COVER_MAX_VIDEO_DURATTION}
          onFinished={onMediaSelected}
          onCancel={closeImagePicker}
          steps={[SelectImageStepWithFrontCameraByDefault, VideoTimeRangeStep]}
          TopPanelWrapper={ImagePickerCardMediaWrapper}
        />
      </Modal>
      <Modal
        visible={showMediaRequiredModal}
        animationType="none"
        onRequestClose={() => setShowMediaRequiredModal(false)}
      >
        <Container
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
        >
          <Icon
            icon="camera"
            style={{ width: 60, height: 60, marginBottom: 10 }}
          />
          <Text variant="large" style={{ marginBottom: 20 }}>
            <FormattedMessage
              defaultMessage="Add a photo"
              description="Cover editor save phoyo required modal title"
            />
          </Text>
          <Text style={{ marginBottom: 20 }}>
            <FormattedMessage
              defaultMessage="Please, use one of your own photo to create your cover"
              description="Cover editor save photo required modal text"
            />
          </Text>
          <Button
            label={intl.formatMessage({
              defaultMessage: 'Select a photo',
              description:
                'Cover editor save photo required modal button label',
            })}
            onPress={() => {
              setShowMediaRequiredModal(false);
              openImagePicker();
            }}
          />
        </Container>
      </Modal>
      {cropMode && (
        <CoverEditorCropModal
          visible
          media={sourceMedia}
          maskMedia={coverStyle.segmented ? maskMedia : null}
          title={title}
          subTitle={subTitle}
          timeRange={timeRange}
          coverStyle={coverStyle}
          mediaParameters={mediaCropParameter}
          colorPalette={colorPalette}
          onClose={toggleCropMode}
          onSave={onSaveCropData}
        />
      )}
      <UploadProgressModal
        visible={saving}
        progressIndicator={uploadProgress}
      />
    </>
  );

  return {
    // Cover data
    title,
    subTitle,
    sourceMedia,
    maskMedia,
    mediaCropParameter,
    coverStyle,
    timeRange,

    // Card colors
    colorPalette,
    otherColors,

    // Current cover data
    currentCoverStyle,
    currentCoverTitle: cardCover?.title,
    currentCoverSubTitle: cardCover?.subTitle,
    currentCoverSourceMedia: cardCover?.sourceMedia,
    cardColors,

    // Media computation state
    mediaComputing: mediaComputation != null,
    mediaComputationError,

    // react elements
    modals,

    //callbacks
    setTitle,
    setSubTitle,
    setCoverStyle,
    toggleCropMode,
    setColorPalette,
    setOtherColors,
    openImagePicker,
    retryMediaComputation,
    updateEditedMediaKind,
    onSave,
  };
};

export default useCoverEditionManager;

const DEFAULT_COVER_STYLE: CoverStyleData = {
  background: null,
  backgroundColor: 'light',
  backgroundPatternColor: 'dark',
  foreground: null,
  foregroundColor: 'primary',
  mediaFilter: null,
  mediaParameters: {},
  merged: false,
  segmented: false,
  subTitleStyle: DEFAULT_COVER_SUBTITLE_TEXT_STYLE,
  textOrientation: 'horizontal',
  textPosition: 'bottomLeft',
  titleStyle: DEFAULT_COVER_TEXT_STYLE,
};

type MaskComputation = {
  promise: Promise<
    | 'canceled'
    | {
        media: {
          uri: string;
          kind: 'image' | 'video';
          width: number;
          height: number;
        };
        editionParameters: EditionParameters;
        maskURI: string | null;
      }
  >;
  cancel: () => void;
};

const createMediaComputation = ({
  uri,
  kind,
  width,
  height,
  editionParameters,
  timeRange,
  maxSize,
  computeMask,
  downscaleMedia,
}: {
  uri: string;
  kind: 'image' | 'video';
  width: number;
  height: number;
  editionParameters: EditionParameters;
  timeRange: TimeRange | null;
  maxSize: number;
  computeMask: boolean;
  downscaleMedia: boolean;
}): MaskComputation => {
  let canceled = false;
  const computeMedia = async () => {
    if (downscaleMedia) {
      const newSize = downScaleImage(width, height, maxSize);
      const resizePath =
        kind === 'image'
          ? await exportImage({
              layers: [{ kind: 'image', uri }],
              size: newSize,
              format: 'auto',
              quality: 95,
            })
          : await exportVideo({
              layers: [
                {
                  kind: 'video',
                  uri,
                  startTime: timeRange?.startTime,
                  duration: timeRange?.duration,
                },
              ],
              size: newSize,
              bitRate: COVER_VIDEO_BITRATE,
              removeSound: true,
            });

      uri = `file://${resizePath}`;
      if (editionParameters.cropData) {
        const scale = newSize.width / width;
        editionParameters = {
          ...editionParameters,
          cropData: mapValues(editionParameters.cropData, v => v * scale),
        };
      }
      width = newSize.width;
      height = newSize.height;
    }
    if (canceled) {
      return 'canceled';
    }

    let maskURI: string | null = null;
    if (computeMask) {
      const maskPath = await segmentImage(uri);
      maskURI = `file://${maskPath}`;
    }
    if (canceled) {
      return 'canceled';
    }
    return {
      media: {
        uri,
        kind,
        width,
        height,
      },
      editionParameters,
      maskURI,
    };
  };

  return {
    promise: computeMedia(),
    cancel: () => {
      canceled = true;
    },
  };
};
