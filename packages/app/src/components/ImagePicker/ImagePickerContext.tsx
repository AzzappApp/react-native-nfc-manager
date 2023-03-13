import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import type {
  ImageEditionParameters,
  Media,
  TimeRange,
  ImageOrientation,
} from '#helpers/mediaHelpers';
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
   * the maximum duration of a video to pick
   */
  maxVideoDuration: number;
  /**
   * the kind of media to pick
   */
  kind: 'image' | 'mixed' | 'video';
  /**
   * the selected media
   */
  media: Media | null;
  /**
   * the aspect ratio of the media
   */
  aspectRatio: number;
  /**
   * the edition parameters applied to the media
   */
  editionParameters: ImageEditionParameters;
  /**
   * the filter applied to the media
   */
  mediaFilter: string | null;
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
   */
  onMediaChange(media: Media): void;
  /**
   * an event dispatched by picker step when the desired aspect ratio is changed
   * @param value the new aspect ratio
   */
  onAspectRatioChange(value: number): void;
  /**
   * an event dispatched by picker step to select a new time range in the video
   * @param timeRange the new time range
   */
  onTimeRangeChange(timeRange: TimeRange | null): void;
  /**
   * an event dispatched by picker step to change the filter applied to the media
   * @param filter the new filter
   */
  onMediaFilterChange(filter: string | null): void;
  /**
   * an event dispatched by picker step to change the edition parameters applied to the media
   * @param editionParameters the new edition parameters
   */
  onEditionParametersChange(editionParameters: ImageEditionParameters): void;
  /**
   * an event dispatched by picker step to change an edition parameter value
   * @param param the parameter to change
   * @param value the new value
   */
  onParameterValueChange<T extends keyof ImageEditionParameters>(
    param: T,
    value: ImageEditionParameters[T],
  ): void;
  /**
   * an event dispatched by picker step to reset the state of the picker
   * @param duration the duration of the selected video
   */
  reset(duration?: number | null): void;
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
   * the children of the provider
   */
  children: ReactNode;
};

const _ImagePickerContextProvider = (
  {
    kind,
    maxVideoDuration,
    forceAspectRatio,
    exporting,
    children,
  }: ImagePickerContextProviderProps,
  forwardedRef: ForwardedRef<ImagePickerState>,
) => {
  const [media, setMedia] = useState<Media | null>(null);
  const [aspectRatio, setAspectRatio] = useState(
    typeof forceAspectRatio === 'number' ? forceAspectRatio : null,
  );
  const [editionParameters, setEditionParameters] =
    useState<ImageEditionParameters>({});
  const [timeRange, setTimeRange] = useState<TimeRange | null>(null);
  const [mediaFilter, setMediaFilter] = useState<string | null>(null);

  const reset = useCallback(() => {
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
  }, [maxVideoDuration, media]);

  const onMediaChange = useCallback(
    (media: Media) => {
      setMedia(media);
      setAspectRatio(forceAspectRatio ?? null);
      reset();
    },
    [forceAspectRatio, reset],
  );

  const onAspectRatioChange = useCallback(
    (aspectRatio: number | undefined) => {
      if (!media) {
        return;
      }
      setAspectRatio(aspectRatio ?? null);
      reset();
    },
    [media, reset],
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
    <T extends keyof ImageEditionParameters>(
      key: T,
      value: ImageEditionParameters[T],
    ) => {
      setEditionParameters(params => ({ ...params, [key]: value }));
    },
    [],
  );

  const pickerState = useMemo<ImagePickerState>(
    () => ({
      kind,
      forceAspectRatio,
      maxVideoDuration,
      media,
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
      reset,
    }),
    [
      kind,
      forceAspectRatio,
      maxVideoDuration,
      media,
      aspectRatio,
      editionParameters,
      mediaFilter,
      timeRange,
      exporting,
      onMediaChange,
      onAspectRatioChange,
      onParameterValueChange,
      onTimeRangeChange,
      reset,
    ],
  );

  useImperativeHandle(forwardedRef, () => pickerState, [pickerState]);

  return (
    <ImagePickerContext.Provider value={pickerState}>
      {children}
    </ImagePickerContext.Provider>
  );
};

/**
 * The root component of the picker.
 * It provides the picker state to all its children.
 * it also manages the display of the picker steps.
 */
export const ImagePickerContextProvider = forwardRef(
  _ImagePickerContextProvider,
);

const getMediaAspectRatio = (media: Media, orientation?: ImageOrientation) => {
  const aspectRatio = media.width / media.height;
  return orientation === 'LEFT' || orientation === 'RIGHT'
    ? 1 / aspectRatio
    : aspectRatio;
};
