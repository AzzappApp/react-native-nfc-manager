import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import EditImageStep from './EditImageStep';
import { ImagePickerContextProvider } from './ImagePickerContext';
import { ImagePickerWizardContainer } from './ImagePickerWizardContainer';
import SelectImageStep from './SelectImageStep';
import type { EditionParameters } from '#helpers/mediaEditions';
import type { Media, TimeRange } from '#helpers/mediaHelpers';
import type { ImagePickerState } from './ImagePickerContext';
import type { Filter } from '@azzapp/shared/filtersHelper';
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
   * The rotation of the media selected in pixels
   */
  rotation: number;
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
  filter: Filter | null;
  /**
   * The time range to be applied to the media
   * Only available for videos
   */
  timeRange: TimeRange | null;
  /**
   * The duration of the video selected
   */
  duration: number | null;
  /**
   * The gallery uri of the media selected
   */
  galleryUri?: string;
};

export type ImagePickerProps = {
  /**
   * The minimum allowed duration for a video
   */
  minVideoDuration?: number;
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
  steps?: Array<
    ComponentType<any> & {
      mediaKind?: 'image' | 'video' | null;
      preload?: () => void;
    }
  >;
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
  onFinished?: ((params: ImagePickerResult) => void) | null;
  /**
   * A callback called when the media selection process is cancelled
   */
  onCancel?: () => void;
  /**
   * A component used to wrap the top panel of the wizard
   */
  TopPanelWrapper?: ComponentType<any>;

  cameraButtonsLeftRightPosition?: number;
  /**
   * the initial data of the media to edit
   */
  initialData?: {
    media: Media;
    editionParameters: EditionParameters | null;
    filter: Filter | null;
    timeRange?: TimeRange | null;
  } | null;
  /**
   * additional data to be passed to the step components
   */
  additionalData?: {
    [key: string]: any;
  };
};
/**
 * A component used to select an image or a video and edit it
 * It has a wizard like interface, and can be customized to add or remove steps.
 *
 */
const ImagePicker = ({
  maxVideoDuration = 15,
  minVideoDuration,
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
  cameraButtonsLeftRightPosition,
  initialData,
  additionalData,
}: ImagePickerProps) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [media, setMedia] = useState<Media | null>(null);
  const pickerStateRef = useRef<ImagePickerState | null>(null);

  const steps = useMemo(
    () => filterSteps(propSteps, media),
    [media, propSteps],
  );

  useEffect(() => {
    propSteps.forEach(step => {
      step.preload?.();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isFirstStep = stepIndex === 0;

  const onNext = useCallback(async () => {
    //when call from the Component, the method reference is not updated
    const nextSteps = filterSteps(propSteps, pickerStateRef?.current?.media);
    const isLastStep = nextSteps.length === stepIndex + 1;

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
        rotation: 'rotation' in media ? media.rotation : 0,
        aspectRatio,
        editionParameters,
        filter: mediaFilter,
        timeRange,
        duration: media.kind === 'video' ? media.duration : null,
        galleryUri: media.galleryUri,
      });
    } else {
      setStepIndex(stepIndex => stepIndex + 1);
    }
  }, [onFinished, propSteps, stepIndex]);

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
      initialData={initialData}
      forceAspectRatio={forceAspectRatio}
      forceCameraRatio={forceCameraRatio}
      maxVideoDuration={maxVideoDuration}
      minVideoDuration={minVideoDuration}
      exporting={exporting}
      kind={kind}
      onMediaChange={setMedia}
      cameraButtonsLeftRightPosition={cameraButtonsLeftRightPosition}
    >
      <ImagePickerWizardContainer
        onBack={onBack}
        onNext={onNext}
        isLastStep={stepIndex === steps.length - 1}
        isFirstStep={isFirstStep}
        busy={exporting || busy}
        canCancel={canCancel}
        TopPanelWrapper={TopPanelWrapper}
      >
        <Component onNext={onNext} onBack={onBack} {...additionalData} />
      </ImagePickerWizardContainer>
    </ImagePickerContextProvider>
  );
};

export const DEFAULT_STEPS = [SelectImageStep, EditImageStep];

export default ImagePicker;

const filterSteps = (
  steps: Array<ComponentType<any> & { mediaKind?: 'image' | 'video' | null }>,
  media: Media | null | undefined,
) =>
  steps.filter(
    step => !media || step.mediaKind == null || step.mediaKind === media.kind,
  );
