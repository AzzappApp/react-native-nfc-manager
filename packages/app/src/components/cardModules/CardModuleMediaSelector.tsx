import { memo } from 'react';
import { useIsCardModuleEdition } from './CardModuleEditionContext';
import CardModuleMediaEditPreview from './CardModuleMediaEditPreview';
import CardModuleMediaItem from './CardModuleMediaItem';
import type { CardModuleSourceMedia } from './cardModuleEditorType';
import type { CardModuleMediaItemProps } from './CardModuleMediaItem';

const CardModuleMediaSelector = (props: CardModuleMediaItemProps) => {
  //test: prefere media over transformed image, should be faster when using multiple media
  const requirePreview = mediaRequireTransform(props.media);

  //Not sure I really need this condition now
  const isEdition = useIsCardModuleEdition();

  if (isEdition && requirePreview) {
    return <CardModuleMediaEditPreview {...props} />;
  }
  return <CardModuleMediaItem {...props} />;
};

export default memo(CardModuleMediaSelector);

const mediaRequireTransform = (media: CardModuleSourceMedia) => {
  const isEditableVideoMedia =
    media.kind === 'video' &&
    media.duration !== media.timeRange?.duration &&
    media.timeRange?.startTime !== 0;
  return (
    media.editionParameters != null ||
    media.filter != null ||
    (media.kind !== 'image' && isEditableVideoMedia)
  );
};
