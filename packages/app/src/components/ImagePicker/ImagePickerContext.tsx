import clamp from 'lodash/clamp';
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  runOnJS,
  useAnimatedReaction,
  useDerivedValue,
  type DerivedValue,
} from 'react-native-reanimated';
import {
  createImageFromNativeBuffer,
  useNativeBuffer,
  type EditionParameters,
  type ImageOrientation,
} from '#helpers/mediaEditions';
import type { SourceMedia, TimeRange } from '#helpers/mediaHelpers';
import type { Filter } from '@azzapp/shared/filtersHelper';
import type { SkImage } from '@shopify/react-native-skia';
import type { ReactNode, ForwardedRef } from 'react';

/**
 * the state of the image picker injected in the step components
 */
export type ImagePickerState = {
  /**
   * the aspect ratio of the image to pick
   * if null, the aspect ratio is the one of the media
   */
  forceAspectRatio: number | undefined;
  /**
   * the aspect ratio of the camera
   */
  forceCameraRatio?: number | undefined;
  /**
   * the maximum duration of a video to pick
   */
  maxVideoDuration: number;
  /**
   * the minimum duration of a video to pick
   */
  minVideoDuration?: number;
  /**
   * the kind of media to pick
   */
  kind: 'image' | 'mixed' | 'video';
  /**
   * the selected media
   */
  media: SourceMedia | null;
  /**
   * The SkImage of the media
   */
  skImage: DerivedValue<SkImage | null>;
  /**
   * true if the SkImage is available
   */
  isSkImageReady: boolean;
  /**
   * the aspect ratio of the media
   */
  aspectRatio: number;
  /**
   * the edition parameters applied to the media
   */
  editionParameters: EditionParameters;
  /**
   * the filter applied to the media
   */
  mediaFilter: Filter | null;
  /**
   * the time range of the video selected
   */
  timeRange: TimeRange | null;
  /**
   * true during the export process
   */
  exporting?: boolean;
  /**
   * an event dispatched by picker step when the media is changed
   *
   * @param media the selected media
   * @param aspectRatio the aspect ratio of the media to force (usefull is difference between gallery and camera)
   */
  onMediaChange(
    media: SourceMedia,
    aspectRatio?: number | null | undefined,
  ): void;
  /**
   * a emthod to clear the selected media
   *
   */
  clearMedia(): void;
  /**
   * an event dispatched by picker step when the desired aspect ratio is changed
   * @param value the new aspect ratio
   */
  onAspectRatioChange(value: number | null): void;
  /**
   * an event dispatched by picker step to select a new time range in the video
   * @param timeRange the new time range
   */
  onTimeRangeChange(timeRange: TimeRange | null): void;
  /**
   * an event dispatched by picker step to change the filter applied to the media
   * @param filter the new filter
   */
  onMediaFilterChange(filter: Filter | null): void;
  /**
   * an event dispatched by picker step to change the edition parameters applied to the media
   * @param editionParameters the new edition parameters
   */
  onEditionParametersChange(editionParameters: EditionParameters): void;
  /**
   * an event dispatched by picker step to change an edition parameter value
   * @param param the parameter to change
   * @param value the new value
   */
  onParameterValueChange<T extends keyof EditionParameters>(
    param: T,
    value: EditionParameters[T],
  ): void;

  cameraButtonsLeftRightPosition?: number;
};

const ImagePickerContext = createContext<ImagePickerState | null>(null);

/**
 * a hook used in picker steps to access the picker state
 * @returns the picker state
 */
export const useImagePickerState = () => {
  const state = useContext(ImagePickerContext);
  if (state === null) {
    throw new Error('Using ImagePickerWizard without context');
  }
  return state;
};

type ImagePickerContextProviderProps = {
  /**
   * the minimum duration of a video
   */
  minVideoDuration?: number;
  /**
   * the maximum duration of a video
   */
  maxVideoDuration: number;
  /**
   * the kind of media to pick
   */
  kind: 'image' | 'mixed' | 'video';
  /**
   * true during the export process
   */
  exporting?: boolean;
  /**
   * the aspect ratio of the image to pick
   */
  forceAspectRatio?: number;
  /**
   * the ratio of the camera
   */
  forceCameraRatio?: number;
  /**
   * the children of the provider
   */
  children: ReactNode;
  /**
   * Dispatched when the media is changed
   * @param media the selected media
   */
  onMediaChange?(media: SourceMedia | null): void;

  cameraButtonsLeftRightPosition?: number;
  /**
   * Initial data for the picker
   */
  initialData?: {
    media: SourceMedia;
    editionParameters: EditionParameters | null;
    filter: Filter | null;
    timeRange?: TimeRange | null;
  } | null;
};

const _ImagePickerContextProvider = (
  {
    kind,
    maxVideoDuration,
    minVideoDuration,
    forceAspectRatio,
    exporting,
    children,
    forceCameraRatio,
    onMediaChange: onMediaChangeProps,
    cameraButtonsLeftRightPosition,
    initialData,
  }: ImagePickerContextProviderProps,
  forwardedRef: ForwardedRef<ImagePickerState>,
) => {
  const [media, setMedia] = useState<SourceMedia | null>(
    initialData?.media ?? null,
  );
  const [aspectRatio, setAspectRatio] = useState(
    typeof forceAspectRatio === 'number' ? forceAspectRatio : null,
  );
  const [editionParameters, setEditionParameters] = useState<EditionParameters>(
    initialData?.editionParameters ?? {},
  );
  const [timeRange, setTimeRange] = useState<TimeRange | null>(
    initialData?.timeRange ?? null,
  );
  const [mediaFilter, setMediaFilter] = useState<Filter | null>(
    initialData?.filter ?? null,
  );

  const previousMedia = useRef(media);
  useEffect(() => {
    if (previousMedia.current !== media) {
      setEditionParameters({});
      let initialTimeRange: TimeRange | null = null;
      if (media?.kind === 'video') {
        initialTimeRange = {
          startTime: 0,
          duration: Math.min(media.duration, maxVideoDuration),
        };
      }
      setTimeRange(initialTimeRange);
      setMediaFilter(null);
      previousMedia.current = media;
    }
  }, [maxVideoDuration, media]);

  const onMediaChange = useCallback(
    (media: SourceMedia, aspectRatio: number | null | undefined = null) => {
      setMedia(media);
      onMediaChangeProps?.(media);
      setAspectRatio(forceAspectRatio ?? aspectRatio ?? null);
    },
    [forceAspectRatio, onMediaChangeProps],
  );

  const clearMedia = useCallback(() => {
    setMedia(null);
    onMediaChangeProps?.(null);
    setAspectRatio(null);
  }, [onMediaChangeProps]);

  const onAspectRatioChange = useCallback(
    (aspectRatio: number | null | undefined) => {
      if (!media) {
        setAspectRatio(aspectRatio ?? null);
        return;
      }
      setAspectRatio(aspectRatio ?? null);
      setEditionParameters(editionParameters => ({
        ...editionParameters,
        cropData: null,
      }));
    },
    [media],
  );

  const onTimeRangeChange = useCallback(
    (value: TimeRange | null) => {
      if (
        value &&
        maxVideoDuration != null &&
        value.duration > maxVideoDuration
      ) {
        if (value.startTime === timeRange?.startTime) {
          value = {
            startTime: value.startTime + value.duration - maxVideoDuration,
            duration: maxVideoDuration,
          };
        } else {
          value = {
            startTime: value.startTime,
            duration: maxVideoDuration,
          };
        }
      }
      setTimeRange(value);
    },
    [maxVideoDuration, timeRange?.startTime],
  );

  const onParameterValueChange = useCallback(
    <T extends keyof EditionParameters>(
      key: T,
      value: EditionParameters[T],
    ) => {
      setEditionParameters(params => ({ ...params, [key]: value }));
    },
    [],
  );

  const nativeBuffer = useNativeBuffer({
    uri: media?.uri,
    kind: media?.kind,
    time: timeRange?.startTime,
    maxSize: media?.kind === 'video' ? MAX_VIDEO_THUMBNAIL_SIZE : null,
  });

  const skImage = useDerivedValue(() => {
    if (!nativeBuffer) {
      return null;
    }
    return createImageFromNativeBuffer(nativeBuffer);
  }, [nativeBuffer]);

  const [isSkImageReady, setIsSkImageReady] = useState(false);

  useAnimatedReaction(
    () => skImage.value,
    (previous, current) => {
      if (previous !== current) {
        if (skImage.value) {
          runOnJS(setIsSkImageReady)(true);
        } else {
          runOnJS(setIsSkImageReady)(false);
        }
      }
    },
  );

  const pickerState = useMemo<ImagePickerState>(
    () => ({
      kind,
      forceAspectRatio,
      maxVideoDuration,
      minVideoDuration,
      media,
      skImage,
      aspectRatio:
        aspectRatio ??
        (media != null
          ? getMediaAspectRatio(media, editionParameters.orientation)
          : 1),
      editionParameters,
      mediaFilter,
      timeRange,
      exporting,
      onMediaChange,
      onAspectRatioChange,
      onEditionParametersChange: setEditionParameters,
      onParameterValueChange,
      onTimeRangeChange,
      onMediaFilterChange: setMediaFilter,
      forceCameraRatio,
      clearMedia,
      cameraButtonsLeftRightPosition,
      isSkImageReady,
    }),
    [
      kind,
      forceAspectRatio,
      maxVideoDuration,
      minVideoDuration,
      media,
      skImage,
      aspectRatio,
      editionParameters,
      mediaFilter,
      timeRange,
      exporting,
      onMediaChange,
      onAspectRatioChange,
      onParameterValueChange,
      onTimeRangeChange,
      forceCameraRatio,
      clearMedia,
      cameraButtonsLeftRightPosition,
      isSkImageReady,
    ],
  );

  useImperativeHandle(forwardedRef, () => pickerState, [pickerState]);

  return (
    <ImagePickerContext.Provider value={pickerState}>
      {children}
    </ImagePickerContext.Provider>
  );
};

export const MAX_VIDEO_THUMBNAIL_SIZE = {
  width: 512,
  height: 512,
};

/**
 * The root component of the picker.
 * It provides the picker state to all its children.
 * it also manages the display of the picker steps.
 */
export const ImagePickerContextProvider = forwardRef(
  _ImagePickerContextProvider,
);

const getMediaAspectRatio = (
  media: SourceMedia,
  orientation?: ImageOrientation | null,
) => {
  const aspectRatio = media.width / media.height;
  return clampAspectRatio(
    orientation === 'LEFT' || orientation === 'RIGHT'
      ? 1 / aspectRatio
      : aspectRatio,
  );
};

const MAX_ASPECT_RATIO = 3.5;
const MIN_ASPECT_RATIO = 0.5;

const clampAspectRatio = (aspectRatio: number) =>
  clamp(aspectRatio, MIN_ASPECT_RATIO, MAX_ASPECT_RATIO);
