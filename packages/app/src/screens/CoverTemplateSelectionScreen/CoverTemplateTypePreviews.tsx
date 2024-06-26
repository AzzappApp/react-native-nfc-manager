import { Image } from 'expo-image';
import { memo, useCallback } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { colors } from '@azzapp/shared/colorsHelpers';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import type {
  CoverTemplateTypeListItem,
  CoverTemplatePreview,
} from './useCoverTemplates';
import type { ListRenderItemInfo } from 'react-native';

type CoverTemplateTypePreviewsProps = {
  template: CoverTemplateTypeListItem;
  onSelect: (preview: CoverTemplatePreview) => void;
};

const CoverTemplateTypePreviews = ({
  template,
  onSelect,
}: CoverTemplateTypePreviewsProps) => {
  const styles = useStyleSheet(styleSheet);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<CoverTemplatePreview>) => {
      return (
        <CoverTemplateTypePreview
          coverTemplatePreview={item}
          onSelect={onSelect}
        />
      );
    },
    [onSelect],
  );

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text variant="large">{template.label}</Text>
      </View>
      <FlatList
        testID="cover-editor-template-list"
        accessibilityRole="list"
        data={template.data as CoverTemplatePreview[]} //force type due to extract from relay issue
        contentContainerStyle={styles.previews}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
        horizontal
        ItemSeparatorComponent={Separator}
      />
    </View>
  );
};
const Separator = () => <View style={styles.separator} />;
const keyExtractor = (item: CoverTemplatePreview) => item.id;

export default memo(CoverTemplateTypePreviews);

type ListItemComponentProps = {
  coverTemplatePreview: CoverTemplatePreview;
  onSelect: (item: CoverTemplatePreview) => void;
};

const ListItemComponent = ({
  coverTemplatePreview,
  onSelect,
}: ListItemComponentProps) => {
  const styles = useStyleSheet(styleSheet);
  const onPress = useCallback(
    () => onSelect(coverTemplatePreview), //should maybe use only the id
    [coverTemplatePreview, onSelect],
  );

  return (
    <PressableNative style={styles.preview} onPress={onPress}>
      <Image
        source={{
          uri:
            coverTemplatePreview.preview.video?.thumbnail ??
            coverTemplatePreview.preview.image?.uri,
        }}
        style={styles.previewMedia}
      />
      {coverTemplatePreview.requiredMedias != null && (
        <View style={styles.badge}>
          <View style={styles.badgeElements}>
            <Icon size={16} icon="landscape" />
            <Text variant="xsmall">{coverTemplatePreview.requiredMedias}</Text>
          </View>
        </View>
      )}
    </PressableNative>
  );
};

const CoverTemplateTypePreview = memo(ListItemComponent);

const styleSheet = createStyleSheet(appearance => ({
  section: {
    height: 53,
    paddingTop: 20,
    paddingLeft: 20,
  },
  container: {
    height: 298,
  },
  content: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  previews: {
    paddingLeft: 20,
    paddingRight: 20,
  },
  preview: {
    borderRadius: 24,
    height: 240,
    overflow: 'hidden',
  },
  previewMedia: {
    width: 150,
    height: 240,
  },
  badge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: appearance === 'light' ? colors.white : colors.black,
    borderRadius: 28,
  },
  badgeElements: {
    display: 'flex',
    flexDirection: 'row',
    gap: 5,
  },
}));

const styles = StyleSheet.create({
  separator: { width: 10 },
});
