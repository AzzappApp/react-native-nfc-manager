import { useIntl } from 'react-intl';
import { ScreenModal } from '#components/NativeRouter';
import ToolBoxSection from '#components/Toolbar/ToolBoxSection';
import useBoolean from '#hooks/useBoolean';
import CardModuleMediaPicker from './CardModuleMediaPicker';
import type { CardModuleMedia } from '../cardModuleEditorType';

type CardModuleMediaReplaceProps = {
  cardModuleMedia: CardModuleMedia;
  /**
   * This will allow to replace a image per a video
   */
  availableVideoSlot: number;

  onUpdateMedia: (media: CardModuleMedia) => void;

  defaultSearchValue?: string | null;
};
const CardModuleMediaReplace = ({
  cardModuleMedia,
  availableVideoSlot,
  onUpdateMedia,
  defaultSearchValue,
}: CardModuleMediaReplaceProps) => {
  const intl = useIntl();
  const [show, openModal, closeModal] = useBoolean(false);

  const onFinished = (medias: CardModuleMedia[]) => {
    onUpdateMedia(medias[0]);
    closeModal();
  };

  return (
    <>
      <ToolBoxSection
        icon="refresh"
        label={intl.formatMessage({
          defaultMessage: 'Replace',
          description: 'Card Module Media Edition Button- Replace',
        })}
        onPress={openModal}
      />
      <ScreenModal
        visible={show}
        animationType="slide"
        onRequestDismiss={closeModal}
      >
        {show && (
          <CardModuleMediaPicker
            initialMedias={[cardModuleMedia]}
            maxVideo={1}
            maxMedia={1}
            allowVideo={
              //allow video only if we are replacing a video or have a valid slot
              availableVideoSlot > 0 || cardModuleMedia.media.kind === 'video'
            }
            onFinished={onFinished}
            onClose={closeModal}
            replacing
            defaultSearchValue={defaultSearchValue}
          />
        )}
      </ScreenModal>
    </>
  );
};

export default CardModuleMediaReplace;
