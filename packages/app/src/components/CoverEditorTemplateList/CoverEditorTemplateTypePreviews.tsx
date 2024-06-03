import { useCallback } from 'react';
import { FlatList, Image, ScrollView, StyleSheet, View } from 'react-native';
import { extractMediasDuration } from '@azzapp/shared/lottieHelpers';
import { keyExtractor } from '#helpers/idHelpers';
import Badge from '#ui/Badge';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import type { ListRenderItemInfo } from 'react-native';

type CoverEditorTemplateTypePreviewsProps = {
  label: string;
  previews: TemplateTypePreview[];
  onSelect: (preview: TemplateTypePreview) => void;
};

export const CoverEditorTemplateTypePreviews = ({
  label,
  previews,
  onSelect,
}: CoverEditorTemplateTypePreviewsProps) => {
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<TemplateTypePreview>) => {
      return (
        <CoverEditorTemplateTypePreview
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

const CoverEditorTemplateTypePreview = ({
  preview,
  onSelect,
}: {
  preview: TemplateTypePreview;
  onSelect: () => void;
}) => {
  const medias = extractMediasDuration(preview.lottie);
  return (
    <PressableNative key={preview.id} style={styles.preview} onPress={onSelect}>
      <Image source={{ uri: preview.media.uri }} style={styles.previewMedia} />
      <Badge style={styles.badge}>
        <View style={styles.badgeElements}>
          <Icon size={16} icon="landscape" />
          <Text variant="xsmall">{medias.length}</Text>
        </View>
      </Badge>
    </PressableNative>
  );
};

export type TemplateTypePreview = {
  coverTemplateId: string;
  id: string;
  media: {
    id: string;
    uri: string;
    aspectRatio: number;
    height: number;
    width: number;
  };
  lottie: Record<string, unknown>;
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
