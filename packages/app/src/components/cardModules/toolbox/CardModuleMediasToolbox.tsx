import { useMemo } from 'react';
import { FormattedMessage } from 'react-intl';
import { ScrollView, View } from 'react-native';
import { colors } from '#theme';
import { MediaImageRenderer } from '#components/medias';
import { TOOLBOX_SECTION_HEIGHT } from '#components/Toolbar/ToolBoxSection';
import { hasCardModuleMediaError } from '#helpers/cardModuleHelpers';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Icon from '#ui/Icon';
import IconButton from '#ui/IconButton';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import CardModuleMediaPickerFloatingTool from './CardModuleMediaPickerFloatingTool';
import type { ModuleKindAndVariant } from '#helpers/webcardModuleHelpers';
import type { CardModuleMedia } from '../cardModuleEditorType';

type CardModuleMediasToolboxProps = {
  cardModuleMedias: CardModuleMedia[];
  close: () => void;
  handleRemoveMedia: (index: number) => void;
  onSelectMedia: (index: number) => void;
  maxVideo: number;
  maxMedia: number;
  onUpdateMedias: (results: CardModuleMedia[]) => void;
  module: ModuleKindAndVariant;
};
const CardModuleMediasToolbox = ({
  cardModuleMedias,
  close,
  handleRemoveMedia,
  onSelectMedia,
  onUpdateMedias,
  maxMedia,
  maxVideo,
  module,
}: CardModuleMediasToolboxProps) => {
  const styles = useStyleSheet(styleSheet);

  return (
    <View style={styles.container}>
      <PressableNative style={styles.previewButton} onPress={close}>
        <Icon icon="arrow_down" />
      </PressableNative>
      {cardModuleMedias.length === 0 ? (
        <View style={styles.viewErrorMessage}>
          <Text variant="error">
            <FormattedMessage
              defaultMessage="No media selected"
              description="CardModuleMediasToolbox - error message when no media are selected"
            />
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          contentContainerStyle={styles.scrollContentContainer}
          showsHorizontalScrollIndicator={false}
        >
          {cardModuleMedias.map((cardMediaModule, index) => {
            if (!cardMediaModule) {
              return <View key={index} style={styles.previewContent} />;
            }

            return (
              <MediaItem
                key={index}
                cardModuleMedia={cardMediaModule}
                index={index}
                handleRemoveMedia={handleRemoveMedia}
                onSelectMedia={onSelectMedia}
                module={module}
              />
            );
          })}
        </ScrollView>
      )}
      <CardModuleMediaPickerFloatingTool
        cardModuleMedias={cardModuleMedias}
        onUpdateMedia={onUpdateMedias}
        maxVideo={maxVideo}
        maxMedia={maxMedia}
      />
    </View>
  );
};

type MediaItemProps = {
  cardModuleMedia: CardModuleMedia;
  index: number;
  handleRemoveMedia: (index: number) => void;
  onSelectMedia: (index: number) => void;
  module: ModuleKindAndVariant;
};

const MediaItem = ({
  cardModuleMedia,
  index,
  handleRemoveMedia,
  onSelectMedia,
  module,
}: MediaItemProps) => {
  const styles = useStyleSheet(styleSheet);
  const { galleryUri, uri, thumbnail, smallThumbnail, id } =
    cardModuleMedia.media ?? {};

  const hasError = useMemo(() => {
    return hasCardModuleMediaError(cardModuleMedia, module);
  }, [cardModuleMedia, module]);

  return (
    <PressableNative
      key={`${id}-${index}`}
      onPress={() => onSelectMedia(index)}
    >
      <View style={styles.previewContent}>
        <MediaImageRenderer
          source={{
            uri: galleryUri ?? smallThumbnail ?? thumbnail ?? uri,
            requestedSize: 66,
            mediaId: id,
          }}
          fit="cover"
          style={[
            styles.previewContent,
            hasError && {
              borderWidth: 1,
              borderColor: colors.red400,
            },
          ]}
        />
      </View>
      <IconButton
        icon="close"
        size={20}
        onPress={() => handleRemoveMedia(index)}
        iconStyle={styles.mediaDeleteIcon}
        style={styles.mediaDeleteButton}
      />
    </PressableNative>
  );
};

const styleSheet = createStyleSheet(appearance => ({
  viewErrorMessage: { justifyContent: 'center' },
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
    paddingRight: 60,
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
    overflow: 'hidden',
    width: TOOLBOX_SECTION_HEIGHT,
    height: TOOLBOX_SECTION_HEIGHT,
  },
  duration: {
    backgroundColor: appearance === 'light' ? colors.white : colors.black,
    borderRadius: 14,
    position: 'absolute',
    bottom: 5,
    right: 5,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  previewPressable: {
    position: 'relative',
  },
  mediaDeleteIcon: {
    tintColor: appearance === 'light' ? colors.black : colors.grey100,
    width: 18,
  },
  mediaDeleteButton: {
    position: 'absolute',
    width: 20,
    height: 20,
    top: 3,
    right: 3,
    backgroundColor: appearance === 'light' ? colors.white : colors.black,
    borderRadius: 10,
    borderColor: appearance === 'light' ? colors.grey100 : colors.grey1000,
  },
}));

export default CardModuleMediasToolbox;
