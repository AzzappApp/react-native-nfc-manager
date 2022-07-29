import { useCallback, useRef, useState } from 'react';
import type { ImageEditionParameters, ImageOrientation } from './EditableImage';
import type { TimeRange } from './helpers';

const useImageEditorState = (maxVideoDuration?: number) => {
  const [editionParameters, setEditionParameters] =
    useState<ImageEditionParameters>({});
  const previousParameters = useRef(editionParameters);
  const [timeRange, setTimeRange] = useState<TimeRange | null>(null);
  const previousTimeRange = useRef(timeRange);

  const [editedParameter, setEditedParam] = useState<
    keyof ImageEditionParameters | null
  >(null);

  const onStartEdition = (param: keyof ImageEditionParameters) => {
    previousParameters.current = editionParameters;
    previousTimeRange.current = timeRange;
    setEditedParam(param);
  };

  function setParameterValue<T extends keyof ImageEditionParameters>(
    key: T,
    value: ImageEditionParameters[T],
  ) {
    setEditionParameters(params => ({ ...params, [key]: value }));
  }

  const onTimeRangeChange = useCallback(
    (value: TimeRange) => {
      if (maxVideoDuration != null && value.duration > maxVideoDuration) {
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

  const onSaveEdition = () => {
    previousParameters.current = editionParameters;
    previousTimeRange.current = timeRange;
    setEditedParam(null);
  };

  const onCancelEdition = () => {
    setEditionParameters(previousParameters.current);
    setTimeRange(previousTimeRange.current);
    setEditedParam(null);
  };

  const updateOrientation = () => {
    let nextOrientation: ImageOrientation;
    switch (editionParameters.orientation) {
      case 'RIGHT':
        nextOrientation = 'DOWN';
        break;
      case 'DOWN':
        nextOrientation = 'LEFT';
        break;
      case 'LEFT':
        nextOrientation = 'UP';
        break;
      case 'UP':
      default:
        nextOrientation = 'RIGHT';
        break;
    }
    setParameterValue('orientation', nextOrientation);
  };

  const [mediaFilter, setMediaFilter] = useState<string | null>(null);

  const reset = (videoDuration?: number | null) => {
    setEditionParameters({});
    previousParameters.current = {};
    const initialTimeRange =
      videoDuration != null
        ? {
            startTime: 0,
            duration:
              maxVideoDuration != null
                ? Math.min(videoDuration, maxVideoDuration)
                : videoDuration,
          }
        : null;
    setTimeRange(initialTimeRange);
    previousTimeRange.current = initialTimeRange;
    setMediaFilter(null);
  };

  return {
    editedParameter,
    editionParameters,
    mediaFilter,
    timeRange,
    onTimeRangeChange,
    onStartEdition,
    onSaveEdition,
    onCancelEdition,
    setParameterValue,
    updateOrientation,
    setMediaFilter,
    reset,
  };
};

export default useImageEditorState;
