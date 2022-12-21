import { useCallback, useMemo, useRef, useState } from 'react';
import EditImageStep from './EditImageStep';
import { ImagePickerContextProvider } from './ImagePickerContext';
import { ImagePickerWizardContainer } from './ImagePickerWizardContainer';
import { exportImage, exportVideo } from './mediaHelpers';
import SelectImageStep from './SelectImageStep';
import type { ImagePickerState } from './ImagePickerContext';
import type { ImageEditionParameters } from './mediaHelpers';
import type { ComponentType } from 'react';

type ImagePickerProps = {
  maxVideoDuration: number;
  forceAspectRatio?: number;
  additionalSteps?: Array<ComponentType<any>>;
  busy?: boolean;
  onFinished(params: {
    kind: 'image' | 'video';
    path: string;
    aspectRatio: number;
    duration?: number;
  }): void;
  onCancel(): void;
};

const ImagePicker = ({
  maxVideoDuration,
  forceAspectRatio,
  additionalSteps,
  busy,
  onFinished,
  onCancel,
}: ImagePickerProps) => {
  const steps = useMemo(
    () => (additionalSteps ? [...STEPS, ...additionalSteps] : STEPS),
    [additionalSteps],
  );
  const [stepIndex, setStepIndex] = useState(0);

  const pickerStateRef = useRef<ImagePickerState | null>(null);

  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === steps.length - 1;

  const [exporting, setExporting] = useState(false);

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
      setExporting(true);
      let path: string;
      try {
        path = await exportMedia({
          uri: media.uri,
          kind: media.kind,
          editionParameters,
          aspectRatio,
          filter: mediaFilter,
          ...timeRange,
        });
      } catch (e) {
        setExporting(false);
        return;
      }

      onFinished?.({
        kind: media.kind,
        path,
        aspectRatio,
        duration: media.kind === 'video' ? media.duration : undefined,
      });
    } else {
      setStepIndex(stepIndex => stepIndex + 1);
    }
  }, [isLastStep, onFinished]);

  const onBack = useCallback(() => {
    if (isFirstStep) {
      onCancel();
    } else {
      setStepIndex(stepIndex => stepIndex - 1);
    }
  }, [isFirstStep, onCancel]);

  const Component = steps[stepIndex];
  return (
    <ImagePickerContextProvider
      ref={pickerStateRef}
      forceAspectRatio={forceAspectRatio}
      maxVideoDuration={maxVideoDuration}
      exporting={exporting}
    >
      <ImagePickerWizardContainer
        onBack={onBack}
        onNext={onNext}
        isLastStep={isLastStep}
        isFirstStep={isFirstStep}
        busy={exporting || busy}
      >
        <Component onNext={onNext} onBack={onBack} />
      </ImagePickerWizardContainer>
    </ImagePickerContextProvider>
  );
};

const STEPS = [SelectImageStep, EditImageStep];

export default ImagePicker;

const VIDEO_MAX_SIZE = 1280;
const IMAGE_MAX_SIZE = 2048;
const VIDEO_BIT_RATE = 3000000;

const exportMedia = ({
  uri,
  kind,
  aspectRatio,
  filter,
  editionParameters,
  removeSound = false,
  startTime,
  duration,
}: {
  uri: string;
  kind: 'image' | 'video';
  aspectRatio: number;
  filter?: string | null;
  editionParameters?: ImageEditionParameters | null;
  removeSound?: boolean;
  startTime?: number;
  duration?: number;
}): Promise<string> => {
  const maxSize = kind === 'image' ? IMAGE_MAX_SIZE : VIDEO_MAX_SIZE;
  const size = {
    width: aspectRatio >= 1 ? maxSize : maxSize * aspectRatio,
    height: aspectRatio < 1 ? maxSize : maxSize / aspectRatio,
  };
  if (kind === 'image') {
    return exportImage({
      uri,
      size,
      filters: filter ? [filter] : [],
      parameters: editionParameters ?? {},
      format: 'JPEG',
      quality: 0.8,
    });
  } else {
    return exportVideo({
      uri,
      size,
      bitRate: VIDEO_BIT_RATE,
      filters: filter ? [filter] : [],
      parameters: editionParameters ?? {},
      removeSound,
      startTime,
      duration,
    });
  }
};
