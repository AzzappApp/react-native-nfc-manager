import { useCallback } from 'react';
import { FlatList, Image, ScrollView, StyleSheet, View } from 'react-native';
import { keyExtractor } from '#helpers/idHelpers';
import Badge from '#ui/Badge';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import type { CoverTemplatePreviewItem } from './useCoverTemplates';
import type { ListRenderItemInfo } from 'react-native';

type CoverTemplateTypePreviewsProps = {
  label: string;
  previews: CoverTemplatePreviewItem[];
  onSelect: (preview: CoverTemplatePreviewItem) => void;
};

export const CoverTemplateTypePreviews = ({
  label,
  previews,
  onSelect,
}: CoverTemplateTypePreviewsProps) => {
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<CoverTemplatePreviewItem>) => {
      return (
        <CoverTemplateTypePreview
          preview={item}
          onSelect={() => onSelect(item)}
        />
      );
    },
    [onSelect],
  );

  return (
    <View style={styles.container}>
      <Text variant="smallbold" style={styles.label}>
        {label}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.content}>
          <FlatList
            testID="cover-editor-template-list"
            accessibilityRole="list"
            data={previews}
            contentContainerStyle={styles.previews}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            directionalLockEnabled
            showsVerticalScrollIndicator={false}
            horizontal
          />
        </View>
      </ScrollView>
    </View>
  );
};

const CoverTemplateTypePreview = ({
  preview,
  onSelect,
}: {
  preview: CoverTemplatePreviewItem;
  onSelect: () => void;
}) => {
  const { media } = preview;
  return (
    <PressableNative key={preview.id} style={styles.preview} onPress={onSelect}>
      <Image
        source={{ uri: media.kind === 'video' ? media.thumbnail : media.uri }}
        style={styles.previewMedia}
      />
      <Badge style={styles.badge}>
        <View style={styles.badgeElements}>
          <Icon size={16} icon="landscape" />
          {/*TODO add nbMedia in database*/}
          <Text variant="xsmall">{5}</Text>
        </View>
      </Badge>
    </PressableNative>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    paddingBottom: 10,
  },
  label: {
    marginLeft: 20,
    fontSize: 16,
  },
  content: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  previews: {
    display: 'flex',
    flexDirection: 'row',
    gap: 10,
  },
  preview: {
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  previewMedia: {
    width: 150,
    height: 240,
  },
  badge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
  },
  badgeElements: {
    display: 'flex',
    flexDirection: 'row',
    gap: 5,
  },
});
