import { useContext } from 'react';
import { useIntl } from 'react-intl';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ImagePickerStep,
  ImagePickerMediaRenderer,
} from '../../components/ImagePicker';
import PostContentPanel from './PostContentPanel';
import PostCreationScreenContext from './PostCreationScreenContext';

const PostContentStep = () => {
  const intl = useIntl();
  const {
    allowLikes,
    allowComments,
    content,
    setAllowLikes,
    setAllowComments,
    setContent,
  } = useContext(PostCreationScreenContext);
  const { bottom: safeAreaBottom } = useSafeAreaInsets();
  return (
    <ImagePickerStep
      stepId={PostContentStep.STEP_ID}
      headerTitle={intl.formatMessage({
        defaultMessage: 'New Post',
        description: 'New post screen title',
      })}
      topPanel={<ImagePickerMediaRenderer />}
      bottomPanel={
        <PostContentPanel
          allowLikes={allowLikes}
          allowComments={allowComments}
          content={content}
          onAllowLikesChange={setAllowLikes}
          onAllowCommentsChange={setAllowComments}
          onContentChange={setContent}
          style={{
            flex: 1,
            marginBottom: safeAreaBottom,
            marginTop: 20,
          }}
        />
      }
    />
  );
};

export default PostContentStep;

PostContentStep.STEP_ID = 'POST_CONTENT';
