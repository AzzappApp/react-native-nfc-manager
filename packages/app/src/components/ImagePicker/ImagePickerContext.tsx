import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import type { EditionParameters, ImageOrientation } from '#components/gpu';
import type { Media, TimeRange } from './imagePickerTypes';
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
  editionParameters: EditionParameters;
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
   * @param aspectRatio the aspect ratio of the media to force (usefull is difference between gallery and camera)
   */
  onMediaChange(media: Media, aspectRatio?: number | null | undefined): void;
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
   * the ratio of the camera
   */
  forceCameraRatio?: number;
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
    forceCameraRatio,
  }: ImagePickerContextProviderProps,
  forwardedRef: ForwardedRef<ImagePickerState>,
) => {
  const [media, setMedia] = useState<Media | null>(null);
  const [aspectRatio, setAspectRatio] = useState(
    typeof forceAspectRatio === 'number' ? forceAspectRatio : null,
  );
  const [editionParameters, setEditionParameters] = useState<EditionParameters>(
    {},
  );
  const [timeRange, setTimeRange] = useState<TimeRange | null>(null);
  const [mediaFilter, setMediaFilter] = useState<string | null>(null);

  useEffect(() => {
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
    (media: Media, aspectRatio: number | null | undefined = null) => {
      setMedia(media);
      setAspectRatio(forceAspectRatio ?? aspectRatio ?? null);
    },
    [forceAspectRatio],
  );

  const onAspectRatioChange = useCallback(
    (aspectRatio: number | undefined) => {
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
      forceCameraRatio,
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
      forceCameraRatio,
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

const getMediaAspectRatio = (
  media: Media,
  orientation?: ImageOrientation | null,
) => {
  const aspectRatio = media.width / media.height;
  return orientation === 'LEFT' || orientation === 'RIGHT'
    ? 1 / aspectRatio
    : aspectRatio;
};
