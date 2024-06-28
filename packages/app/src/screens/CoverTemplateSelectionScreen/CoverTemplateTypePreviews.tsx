import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { memo, useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Video from 'react-native-video';
import { graphql, useFragment } from 'react-relay';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';

import type { CoverTemplateTypePreviews_coverTemplate$data } from '#relayArtifacts/CoverTemplateTypePreviews_coverTemplate.graphql';
import type { CoverTemplateType } from './useCoverTemplateTypes';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';
import type { ListRenderItemInfo } from '@shopify/flash-list';
import type { ViewToken } from 'react-native';

type CoverTemplateTypePreviewsProps = {
  template: CoverTemplateType;
  onSelect: (preview: CoverTemplate) => void;
  videoToPlay: number;
};

const CoverTemplateTypePreviews = ({
  template,
  videoToPlay,
  onSelect,
}: CoverTemplateTypePreviewsProps) => {
  const styles = useStyleSheet(styleSheet);

  const coverTemplate = useFragment(
    graphql`
      fragment CoverTemplateTypePreviews_coverTemplate on CoverTemplate
      @argumentDefinitions(
        pixelRatio: { type: "Float!", provider: "PixelRatio.relayprovider" }
      )
      @relay(plural: true) {
        id
        mediaCount
        order
        preview {
          id
          ... on MediaImage @alias(as: "image") {
            uri(width: 512, pixelRatio: $pixelRatio)
          }
          ... on MediaVideo @alias(as: "video") {
            uri(width: 512, pixelRatio: $pixelRatio)
            thumbnail(width: 512)
          }
        }
      }
    `,
    template.coverTemplates,
  ) as CoverTemplate[];

  //# region viewable to handle video preview
  const [videoIndexToPlay, setVideoIndexToPlay] = useState<
    Array<number | null>
  >([]);

  const onViewableItemChanged = useCallback(
    (info: { viewableItems: ViewToken[] }) => {
      // when scrolling the previous flatlist, (parent) it is not actualize because already render

      if (info.viewableItems) {
        setVideoIndexToPlay(info.viewableItems.map(item => item.index));
      } else {
        setVideoIndexToPlay([]);
      }
    },
    [],
  );

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<CoverTemplate>) => {
      return (
        <CoverTemplateTypePreview
          coverTemplate={item}
          onSelect={onSelect}
          shoudPlay={videoIndexToPlay.slice(0, videoToPlay).includes(index)}
        />
      );
    },
    [onSelect, videoIndexToPlay, videoToPlay],
  );
  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text variant="large">{template.label}</Text>
      </View>
      <FlashList
        testID="cover-editor-template-list"
        accessibilityRole="list"
        data={coverTemplate}
        contentContainerStyle={styles.previews}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
        horizontal
        ItemSeparatorComponent={Separator}
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemChanged}
        estimatedItemSize={240}
        extraData={videoIndexToPlay}
      />
    </View>
  );
};
const Separator = () => <View style={styles.separator} />;
const keyExtractor = (item: CoverTemplate) => item.id;
const viewabilityConfig = {
  itemVisiblePercentThreshold: 86,
};
export default memo(CoverTemplateTypePreviews);

type ListItemComponentProps = {
  coverTemplate: CoverTemplate;
  onSelect: (item: CoverTemplate) => void;
  shoudPlay: boolean;
};

const ListItemComponent = ({
  coverTemplate,
  onSelect,
  shoudPlay,
}: ListItemComponentProps) => {
  const styles = useStyleSheet(styleSheet);
  const onPress = useCallback(
    () => onSelect(coverTemplate),
    [coverTemplate, onSelect],
  );

  return (
    <PressableNative style={styles.preview} onPress={onPress}>
      {coverTemplate.preview.video ? (
        <Video
          source={{ uri: coverTemplate.preview.video.uri }}
          muted={false}
          repeat
          style={styles.previewMedia}
          resizeMode="contain"
          paused={!shoudPlay}
          poster={coverTemplate.preview.video?.thumbnail}
          disableFocus={true}
        />
      ) : (
        <Image
          source={{
            uri: coverTemplate.preview.image?.uri,
          }}
          style={styles.previewMedia}
        />
      )}
      {coverTemplate.mediaCount != null && (
        <View style={styles.badge}>
          <View style={styles.badgeElements}>
            <Icon size={16} icon="landscape" />
            <Text variant="xsmall">{coverTemplate.mediaCount}</Text>
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
    borderWidth: 1,
    borderColor: appearance === 'light' ? colors.grey50 : colors.grey900,
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

export type CoverTemplate = NonNullable<
  ArrayItemType<CoverTemplateTypePreviews_coverTemplate$data>
>;
