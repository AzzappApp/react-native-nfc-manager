import { useIntl } from 'react-intl';
import Header from '#ui/Header';
import IconButton from '#ui/IconButton';

const PostCommentsScreenHeader = ({ onClose }: { onClose: () => void }) => {
  const intl = useIntl();

  return (
    <Header
      middleElement={intl.formatMessage({
        defaultMessage: 'Comments',
        description: 'Post Comments header title',
      })}
      leftElement={
        <IconButton
          icon="arrow_down"
          onPress={onClose}
          iconSize={30}
          size={47}
          variant="icon"
        />
      }
    />
  );
};

export default PostCommentsScreenHeader;
