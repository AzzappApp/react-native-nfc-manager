import { useIntl } from 'react-intl';
import { ScreenModal } from '#components/NativeRouter';
import ToolBoxSection from '#components/Toolbar/ToolBoxSection';
import useToggle from '#hooks/useToggle';
import CardModuleMediaPicker from './CardModuleMediaPicker';
import type { CardModuleMedia } from '../cardModuleEditorType';

type CardModuleMediaReplaceProps = {
  cardModuleMedia: CardModuleMedia;
  /**
   * This will allow to replace a image per a video
   */
  allowVideo: boolean;

  onUpdateMedia: (media: CardModuleMedia) => void;
};
const CardModuleMediaReplace = ({
  cardModuleMedia,
  allowVideo,
  onUpdateMedia,
}: CardModuleMediaReplaceProps) => {
  const intl = useIntl();
  const [show, toggleScreenModal] = useToggle(false);

  const onFinished = (medias: CardModuleMedia[]) => {
    onUpdateMedia(medias[0]);
    toggleScreenModal();
  };

  return (
    <>
      <ToolBoxSection
        icon="refresh"
        label={intl.formatMessage({
          defaultMessage: 'Replace',
          description: 'Card Module Media Edition Button- Replace',
        })}
        onPress={toggleScreenModal}
      />
      <ScreenModal
        visible={show}
        animationType="slide"
        onRequestDismiss={toggleScreenModal}
      >
        {show && (
          <CardModuleMediaPicker
            initialMedias={[cardModuleMedia]}
            maxVideo={allowVideo ? 1 : 0}
            maxMedia={1}
            allowVideo={allowVideo}
            onFinished={onFinished}
            onClose={toggleScreenModal}
          />
        )}
      </ScreenModal>
    </>
  );
};

export default CardModuleMediaReplace;
