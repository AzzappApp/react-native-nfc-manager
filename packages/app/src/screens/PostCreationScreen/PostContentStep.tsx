import { useIntl } from 'react-intl';
import {
  ImagePickerStep,
  ImagePickerMediaRenderer,
} from '#components/ImagePicker';
import PostContentPanel from './PostContentPanel';

const PostContentStep = () => {
  const intl = useIntl();

  return (
    <ImagePickerStep
      stepId={PostContentStep.STEP_ID}
      headerTitle={intl.formatMessage({
        defaultMessage: 'New Post',
        description: 'New post screen title',
      })}
      headerRightButtonTitle={intl.formatMessage({
        defaultMessage: 'Publish',
        description: 'Publish button action Post Content Screen',
      })}
      topPanel={<ImagePickerMediaRenderer />}
      bottomPanel={<PostContentPanel />}
    />
  );
};

export default PostContentStep;

PostContentStep.STEP_ID = 'POST_CONTENT';
