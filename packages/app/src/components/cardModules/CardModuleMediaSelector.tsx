import { memo } from 'react';
import { useIsCardModuleEdition } from './CardModuleEditionContext';
import CardModuleMediaEditPreview from './CardModuleMediaEditPreview';
import CardModuleMediaItem from './CardModuleMediaItem';
import type { CardModuleMediaItemProps } from './CardModuleMediaItem';

const CardModuleMediaSelector = (props: CardModuleMediaItemProps) => {
  const MediaItemRenderer = useIsCardModuleEdition()
    ? CardModuleMediaEditPreview
    : CardModuleMediaItem;

  return <MediaItemRenderer {...props} />;
};

export default memo(CardModuleMediaSelector);
