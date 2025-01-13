import { View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { colors } from '#theme';
import { MediaImageRenderer } from '#components/medias';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { isFileURL } from '#helpers/fileHelpers';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import { TOOLBOX_SECTION_HEIGHT } from '../../Toolbar/ToolBoxSection';
import CardModuleMediaEditorTool from '../tool/CardModuleMediaEditorTool';
import CardModuleMediaReplace from '../tool/CardModuleMediaReplace';
import CardModuleMediaTextTool from '../tool/CardModuleMediaTextTool';
import type { ModuleKindAndVariant } from '#helpers/webcardModuleHelpers';
import type { CardModuleMedia } from '../cardModuleEditorType';

type CardModuleMediaEditToolboxProps<T extends ModuleKindAndVariant> = {
  cardModuleMedia: CardModuleMedia;
  onUpdateMedia: (media: CardModuleMedia) => void;
  availableVideoSlot: number;
  close: () => void;
  module: T;
  defaultSearchValue?: string | null;
};
const CardModuleMediaEditToolbox = <T extends ModuleKindAndVariant>({
  module,
  cardModuleMedia,
  onUpdateMedia,
  availableVideoSlot,
  defaultSearchValue,
  close,
}: CardModuleMediaEditToolboxProps<T>) => {
  const styles = useStyleSheet(styleSheet);

  const { galleryUri, uri, thumbnail, smallThumbnail, id } =
    cardModuleMedia.media ?? {};
  return (
    <View style={styles.container}>
      <PressableNative style={styles.previewButton} onPress={close}>
        <Icon icon="arrow_down" />
        <MediaImageRenderer
          source={{
            uri: galleryUri ?? smallThumbnail ?? thumbnail ?? uri,
            requestedSize: 66,
            mediaId: id,
          }}
          fit="cover"
          style={styles.previewContent}
        />
      </PressableNative>
      <ScrollView
        horizontal
        contentContainerStyle={styles.scrollContentContainer}
        showsHorizontalScrollIndicator={false}
      >
        <CardModuleMediaTextTool
          module={module}
          onUpdateMedia={onUpdateMedia}
          cardModuleMedia={cardModuleMedia}
        />
        {/* show only the editor if the media is local, need to find a better proper way */}
        {isFileURL(cardModuleMedia.media?.uri) && (
          <CardModuleMediaEditorTool
            cardModuleMedia={cardModuleMedia}
            onFinish={onUpdateMedia}
          />
        )}

        <CardModuleMediaReplace
          cardModuleMedia={cardModuleMedia}
          availableVideoSlot={availableVideoSlot}
          onUpdateMedia={onUpdateMedia}
          defaultSearchValue={defaultSearchValue}
        />
      </ScrollView>
    </View>
  );
};

const styleSheet = createStyleSheet(appearance => ({
  container: {
    height: TOOLBOX_SECTION_HEIGHT,
    width: '100%',
    flexDirection: 'row',
    backgroundColor: appearance === 'light' ? colors.white : colors.black,
    marginLeft: 10,
    position: 'relative',
  },
  scrollContentContainer: {
    gap: 5,
    height: TOOLBOX_SECTION_HEIGHT,
    paddingLeft: 5,
    paddingRight: 20,
  },
  previewButton: {
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    alignItems: 'center',
    marginRight: 5,
    rowGap: 1,
    flexShrink: 0,
    backgroundColor: appearance === 'light' ? colors.grey50 : colors.grey900,
    borderRadius: 10,
    height: TOOLBOX_SECTION_HEIGHT,
  },
  previewContent: {
    backgroundColor: appearance === 'light' ? colors.grey600 : colors.grey400,
    borderRadius: 8,
    width: 45,
    height: 45,
  },
}));

export default CardModuleMediaEditToolbox;
