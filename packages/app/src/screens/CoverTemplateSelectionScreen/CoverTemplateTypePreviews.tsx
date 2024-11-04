import { FlashList } from '@shopify/flash-list';
import { memo, useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { colors } from '#theme';
import { MediaVideoRenderer } from '#components/medias';
import { useScreenHasFocus } from '#components/NativeRouter';
import Skeleton from '#components/Skeleton';
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
        pixelRatio: {
          type: "Float!"
          provider: "CappedPixelRatio.relayprovider"
        }
      )
      @relay(plural: true) {
        id
        mediaCount
        medias {
          editable
        }
        order
        preview {
          id
          ... on MediaVideo {
            uri(width: 512, pixelRatio: $pixelRatio)
            thumbnail(width: 512, pixelRatio: $pixelRatio)
          }
        }
        previewPositionPercentage
        backgroundColor
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

  const hasFocus = useScreenHasFocus();

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<CoverTemplate>) => {
      return (
        <CoverTemplateTypePreview
          coverTemplate={item}
          onSelect={onSelect}
          shouldPlay={
            !!hasFocus && videoIndexToPlay.slice(0, videoToPlay).includes(index)
          }
        />
      );
    },
    [onSelect, videoIndexToPlay, videoToPlay, hasFocus],
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
        extraData={[videoIndexToPlay, videoToPlay]}
      />
    </View>
  );
};
const Separator = () => <View style={styles.separator} />;
const keyExtractor = (item: CoverTemplate) => item.id;

const viewabilityConfig = {
  itemVisiblePercentThreshold: 80,
};

export default memo(CoverTemplateTypePreviews);

type ListItemComponentProps = {
  coverTemplate: CoverTemplate;
  onSelect: (item: CoverTemplate) => void;
  shouldPlay: boolean;
};

const ListItemComponent = ({
  coverTemplate,
  onSelect,
  shouldPlay,
}: ListItemComponentProps) => {
  const styles = useStyleSheet(styleSheet);
  const onPress = useCallback(
    () => onSelect(coverTemplate),
    [coverTemplate, onSelect],
  );

  if (!coverTemplate.preview.uri) {
    return null;
  }
  return (
    <PressableNative style={styles.preview} onPress={onPress}>
      <MediaVideoRenderer
        source={{
          mediaId: coverTemplate.preview.id,
          uri: coverTemplate.preview.uri!,
          requestedSize: 512,
        }}
        thumbnailURI={coverTemplate.preview.thumbnail}
        muted
        style={styles.previewMedia}
        videoEnabled={shouldPlay}
      />
      {coverTemplate.mediaCount != null && (
        <View style={styles.badge}>
          <View style={styles.badgeElements}>
            <Icon size={16} icon="landscape" />
            <Text variant="xsmall">
              {coverTemplate.mediaCount -
                coverTemplate.medias.filter(media => !media.editable).length}
            </Text>
          </View>
        </View>
      )}
    </PressableNative>
  );
};

const CoverTemplateTypePreview = memo(ListItemComponent);

export const CoverTemplateTypePreviewFallback = () => {
  const styles = useStyleSheet(styleSheet);
  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Skeleton style={{ width: 70, height: 20, borderRadius: 8 }} />
      </View>
      <View
        style={[
          styles.previews,
          {
            flexDirection: 'row',
            gap: 10,
          },
        ]}
      >
        <Skeleton style={[styles.preview, { width: 150 }]} />
        <Skeleton style={[styles.preview, { width: 150 }]} />
        <Skeleton style={[styles.preview, { width: 150 }]} />
      </View>
    </View>
  );
};

const styleSheet = createStyleSheet(appearance => ({
  section: {
    height: 53,
    paddingTop: 20,
    paddingLeft: 20,
  },
  container: {
    height: 298,
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
    flexShrink: 0,
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
