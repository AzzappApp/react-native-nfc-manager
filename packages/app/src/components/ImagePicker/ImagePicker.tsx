import { useCallback, useRef, useState } from 'react';
import EditImageStep from './EditImageStep';
import { ImagePickerContextProvider } from './ImagePickerContext';
import { ImagePickerWizardContainer } from './ImagePickerWizardContainer';
import SelectImageStep from './SelectImageStep';
import type { ImageEditionParameters, TimeRange } from '#types';
import type { ImagePickerState } from './ImagePickerContext';
import type { ComponentType } from 'react';

export type ImagePickerResult = {
  kind: 'image' | 'video';
  uri: string;
  width: number;
  height: number;
  aspectRatio: number;
  editionParameters: ImageEditionParameters;
  filter: string | null;
  timeRange: TimeRange | null;
};

type ImagePickerProps = {
  maxVideoDuration?: number;
  forceAspectRatio?: number;
  steps?: Array<ComponentType<any>>;
  kind?: 'image' | 'mixed' | 'video';
  busy?: boolean;
  canCancel?: boolean;
  exporting?: boolean;
  onFinished(params: ImagePickerResult): void;
  onCancel(): void;
};

const ImagePicker = ({
  maxVideoDuration = 10,
  forceAspectRatio,
  steps = DEFAULT_STEPS,
  kind = 'mixed',
  busy,
  canCancel = true,
  exporting = false,
  onFinished,
  onCancel,
}: ImagePickerProps) => {
  const [stepIndex, setStepIndex] = useState(0);

  const pickerStateRef = useRef<ImagePickerState | null>(null);

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
      onFinished?.({
        ...media,
        aspectRatio,
        editionParameters,
        filter: mediaFilter,
        timeRange,
      });
    } else {
      setStepIndex(stepIndex => stepIndex + 1);
    }
  }, [isLastStep, onFinished]);

  const onBack = useCallback(() => {
    if (isFirstStep && canCancel) {
      onCancel();
    } else {
      setStepIndex(stepIndex => stepIndex - 1);
    }
  }, [isFirstStep, onCancel, canCancel]);

  const Component = steps[stepIndex];

  return (
    <ImagePickerContextProvider
      ref={pickerStateRef}
      forceAspectRatio={forceAspectRatio}
      maxVideoDuration={maxVideoDuration}
      exporting={exporting}
      kind={kind}
    >
      <ImagePickerWizardContainer
        onBack={onBack}
        onNext={onNext}
        isLastStep={isLastStep}
        isFirstStep={isFirstStep}
        busy={exporting || busy}
        canCancel={canCancel}
      >
        <Component onNext={onNext} onBack={onBack} />
      </ImagePickerWizardContainer>
    </ImagePickerContextProvider>
  );
};

export const DEFAULT_STEPS = [SelectImageStep, EditImageStep];

export default ImagePicker;
