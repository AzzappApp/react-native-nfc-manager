import SelectImageStep from '#components/ImagePicker/SelectImageStep';
import type { SelectImageStepProps } from '#components/ImagePicker/SelectImageStep';

const CoverEditionImagePickerSelectImageStep = (
  props: SelectImageStepProps,
) => {
  return <SelectImageStep {...props} initialCameraPosition="front" />;
};

export default CoverEditionImagePickerSelectImageStep;
