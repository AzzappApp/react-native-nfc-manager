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
} from '../../types';
import type { ReactNode, ForwardedRef } from 'react';

export type ImagePickerState = {
  forceAspectRatio: number | undefined;
  maxVideoDuration: number;
  kind: 'image' | 'mixed' | 'video';
  media: Media | null;
  aspectRatio: number;
  editionParameters: ImageEditionParameters;
  mediaFilter: string | null;
  timeRange: TimeRange | null;
  exporting?: boolean;
  onMediaChange(media: Media): void;
  onAspectRatioChange(value: number): void;
  onTimeRangeChange(timeRange: TimeRange | null): void;
  onMediaFilterChange(filter: string | null): void;
  onEditionParametersChange(editionParameters: ImageEditionParameters): void;
  onParameterValueChange<T extends keyof ImageEditionParameters>(
    param: T,
    value: ImageEditionParameters[T],
  ): void;
  reset(duration?: number | null): void;
};

const ImagePickerContext = createContext<ImagePickerState | null>(null);

export const useImagePickerState = () => {
  const state = useContext(ImagePickerContext);
  if (state === null) {
    throw new Error('Using ImagePickerWizard without context');
  }
  return state;
};

type ImagePickerContextProviderProps = {
  maxVideoDuration: number;
  kind: 'image' | 'mixed' | 'video';
  exporting?: boolean;
  forceAspectRatio?: number;
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

export const ImagePickerContextProvider = forwardRef(
  _ImagePickerContextProvider,
);

const getMediaAspectRatio = (media: Media, orientation?: ImageOrientation) => {
  const aspectRatio = media.width / media.height;
  return orientation === 'LEFT' || orientation === 'RIGHT'
    ? 1 / aspectRatio
    : aspectRatio;
};
