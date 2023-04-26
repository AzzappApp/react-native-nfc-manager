import { Fragment, useCallback, useMemo, useRef, useState } from 'react';
import EditImageStep from './EditImageStep';
import { ImagePickerContextProvider } from './ImagePickerContext';
import { ImagePickerWizardContainer } from './ImagePickerWizardContainer';
import SelectImageStep from './SelectImageStep';
import type { EditionParameters } from '#components/gpu';
import type { ImagePickerState } from './ImagePickerContext';
import type { Media, TimeRange } from './imagePickerTypes';
import type { ComponentType } from 'react';

export type ImagePickerResult = {
  /**
   * The kind of media selected
   */
  kind: 'image' | 'video';
  /**
   * The uri of the media selected
   */
  uri: string;
  /**
   * The width of the media selected
   */
  width: number;
  /**
   * The height of the media selected
   */
  height: number;
  /**
   * The aspect ratio of the media selected
   */
  aspectRatio: number;
  /**
   * The edition parameters to be applied to the media
   */
  editionParameters: EditionParameters;
  /**
   * The filter to be applied to the media
   */
  filter: string | null;
  /**
   * The time range to be applied to the media
   * Only available for videos
   */
  timeRange: TimeRange | null;
};

export type ImagePickerProps = {
  /**
   * The maximum allowed duration for a video
   */
  maxVideoDuration?: number;
  /**
   * The aspect ratio to force on the media
   * If not provided, the aspect ratio will be the one of the media
   */
  forceAspectRatio?: number;
  /**
   * The aspect ratio to force on the camera
   */
  forceCameraRatio?: number;
  /**
   * The steps to display in the wizard
   * By default, it will display the SelectImageStep and the EditImageStep
   * You can add or remove steps, but you must make sure that the first step is a SelectImageStep
   */
  steps?: Array<ComponentType<any> & { mediaKind?: 'image' | 'video' | null }>;
  /**
   * The kind of media to select
   * By default, it will allow to select both images and videos
   */
  kind?: 'image' | 'mixed' | 'video';
  /**
   * Whether the component is busy
   */
  busy?: boolean;
  /**
   * Whether the component is exporting
   * If true, the next button will be replaced by a loading indicator
   * It will also display a loading indicator in place of the media preview on Android
   * for performance reasons
   */
  exporting?: boolean;
  /**
   * Whether the media selection process can be cancelled
   */
  canCancel?: boolean;
  /**
   * A callback called when the media selection process is finished
   */
  onFinished(params: ImagePickerResult): void;
  /**
   * A callback called when the media selection process is cancelled
   */
  onCancel?: () => void;
  /**
   * A component used to wrap the top panel of the wizard
   */
  TopPanelWrapper?: ComponentType<any>;
};
/**
 * A component used to select an image or a video and edit it
 * It has a wizard like interface, and can be customized to add or remove steps.
 *
 */
const ImagePicker = ({
  maxVideoDuration = 15,
  forceAspectRatio,
  steps: propSteps = DEFAULT_STEPS,
  kind = 'mixed',
  busy,
  canCancel = true,
  exporting = false,
  forceCameraRatio,
  onFinished,
  onCancel,
  TopPanelWrapper = Fragment,
}: ImagePickerProps) => {
  const [stepIndex, setStepIndex] = useState(0);

  const pickerStateRef = useRef<ImagePickerState | null>(null);
  const [media, setMedia] = useState<Media | null>(null);
  const steps = useMemo(
    () =>
      propSteps.filter(
        step =>
          !media || step.mediaKind == null || step.mediaKind === media.kind,
      ),
    [propSteps, media],
  );

  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === steps.length - 1;

  const onNext = useCallback(async () => {
    if (isLastStep) {
      if (!pickerStateRef.current) {
        return;
      }
      const { media, editionParameters, aspectRatio, mediaFilter, timeRange } =
        pickerStateRef.current;
      if (!media) {
        return;
      }
      let resultTimeRange: TimeRange | null = null;
      if (
        media.kind === 'video' &&
        timeRange &&
        timeRange.startTime !== 0 &&
        Math.abs(timeRange.duration - media.duration) > 0.1
      ) {
        resultTimeRange = timeRange;
      }
      onFinished?.({
        ...media,
        aspectRatio,
        editionParameters,
        filter: mediaFilter,
        timeRange: resultTimeRange,
      });
    } else {
      setStepIndex(stepIndex => stepIndex + 1);
    }
  }, [isLastStep, onFinished]);

  const onBack = useCallback(() => {
    if (isFirstStep) {
      if (canCancel) {
        onCancel?.();
      }
    } else {
      setStepIndex(stepIndex => stepIndex - 1);
    }
  }, [isFirstStep, onCancel, canCancel]);

  const Component = steps[stepIndex];

  return (
    <ImagePickerContextProvider
      ref={pickerStateRef}
      forceAspectRatio={forceAspectRatio}
      forceCameraRatio={forceCameraRatio}
      maxVideoDuration={maxVideoDuration}
      exporting={exporting}
      kind={kind}
      onMediaChange={setMedia}
    >
      <ImagePickerWizardContainer
        onBack={onBack}
        onNext={onNext}
        isLastStep={isLastStep}
        isFirstStep={isFirstStep}
        busy={exporting || busy}
        canCancel={canCancel}
        TopPanelWrapper={TopPanelWrapper}
      >
        <Component onNext={onNext} onBack={onBack} />
      </ImagePickerWizardContainer>
    </ImagePickerContextProvider>
  );
};

export const DEFAULT_STEPS = [SelectImageStep, EditImageStep];

export default ImagePicker;
