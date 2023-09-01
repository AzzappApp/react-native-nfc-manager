import { memo, useCallback, useState } from 'react';
import { Image, View, FlatList } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { graphql, useFragment } from 'react-relay';
import { COVER_CARD_RADIUS, COVER_RATIO } from '@azzapp/shared/coverHelpers';
import { colors, shadow } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import useAnimatedState from '#hooks/useAnimatedState';
import PressableNative from '#ui/PressableNative';
import CardModuleBackgroundImage from './cardModules/CardModuleBackgroundImage';
import type {
  StaticMediaList_staticMedias$data,
  StaticMediaList_staticMedias$key,
} from '@azzapp/relay/artifacts/StaticMediaList_staticMedias.graphql';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';
import type {
  LayoutChangeEvent,
  ColorValue,
  ListRenderItemInfo,
} from 'react-native';

import type { ViewProps } from 'react-native-svg/lib/typescript/fabric/utils';

type StaticMediaListProps = ViewProps & {
  /**
   * The list of static medias to display.
   */
  medias: StaticMediaList_staticMedias$key;
  /**
   * the id of the currently selected media.
   */
  selectedMedia: string | null | undefined;
  /**
   * the background color of the displayed medias.
   */
  backgroundColor?: ColorValue;
  /**
   * the tint color of the displayed medias.
   */
  tintColor?: ColorValue;
  /**
   * if true, the medias will be displayed using svg.
   */
  svgMode?: boolean;
  /**
   * the aspect ratio of the media buttons.
   */
  imageRatio?: number;
  /**
   * a callback called when the user select a media.
   * @param media the id of the selected media.
   */
  onSelectMedia: (media: string | null) => void;
};

/**
 * Displays a list of static medias and let the user select one.
 */
const StaticMediaList = ({
  medias: mediasKey,
  selectedMedia,
  onSelectMedia,
  backgroundColor = '#FFFFFF',
  tintColor = '#000000',
  imageRatio = COVER_RATIO,
  svgMode = false,
  testID = 'cover-media-list',
  style,
}: StaticMediaListProps) => {
  const staticMedias = useFragment(
    graphql`
      fragment StaticMediaList_staticMedias on StaticMedia
      @relay(plural: true) {
        id
        # we use arbitrary values here, but it should be good enough
        smallURI: uri(width: 125, pixelRatio: 2)
        resizeMode
      }
    `,
    mediasKey,
  );

  const styles = useStyleSheet(styleSheet);

  const renderItem = useCallback(
    ({
      item,
    }: ListRenderItemInfo<ArrayItemType<StaticMediaList_staticMedias$data> | null>) => {
      if (item) {
        return (
          <StaticMediaListItemMemo
            item={item}
            imageRatio={imageRatio}
            isSelected={selectedMedia === item.id}
            resizeMode={item.resizeMode}
            backgroundColor={backgroundColor}
            onSelectMedia={onSelectMedia}
            svgMode={svgMode}
            tintColor={tintColor}
          />
        );
      }
      return null;
    },
    [
      backgroundColor,
      imageRatio,
      onSelectMedia,
      selectedMedia,
      svgMode,
      tintColor,
    ],
  );

  return (
    <FlatList
      data={[null, ...staticMedias]}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.flatListStyle, style]}
      contentContainerStyle={styles.container}
      renderItem={renderItem}
      testID={testID}
      accessibilityRole="list"
    />
  );
};

export default StaticMediaList;

const styleSheet = createStyleSheet(appearance => ({
  flatListStyle: { overflow: 'visible' },
  container: {
    paddingVertical: 10,
    paddingStart: 20,
    columnGap: 10,
    alignItems: 'center',
  },
  button: [
    {
      flex: 1,
      overflow: 'visible',
    },
    shadow(appearance),
  ],
  image: {
    height: '100%',
  },
  nullImage: {
    borderWidth: 2,
    borderColor: colors.black,
  },
}));

type StaticMediaListItemProps = {
  item: ArrayItemType<StaticMediaList_staticMedias$data>;
  imageRatio: number;
  isSelected: boolean;
  backgroundColor: ColorValue;
  onSelectMedia: (id: string) => void;
  svgMode: boolean;
  tintColor: ColorValue | string;
  /**
   *
   *
   * @type {('center' | 'contain' | 'cover' | 'repeat' | 'stretch' | null)}
   */
  resizeMode: string | null;
};

const StaticMediaListItem = ({
  item,
  imageRatio,
  isSelected,
  backgroundColor,
  tintColor,
  onSelectMedia,
  svgMode,
  resizeMode,
}: StaticMediaListItemProps) => {
  const timing = useAnimatedState(isSelected, { duration: 120 });

  const itemAnimatedStyle = useAnimatedStyle(() => {
    return {
      height: '100%',
      aspectRatio: imageRatio,
      transform: [{ scale: interpolate(timing.value, [0, 1], [1, 1.1]) }],
    };
  }, [imageRatio, timing]);
  const styles = useStyleSheet(styleSheet);

  const onPress = useCallback(() => {
    onSelectMedia(item.id);
  }, [item.id, onSelectMedia]);

  const [layout, setLayout] = useState({ width: 0, height: 0 });

  const onLayout = (event: LayoutChangeEvent) => {
    setLayout(event.nativeEvent.layout);
  };

  return (
    <Animated.View style={[itemAnimatedStyle]} onLayout={onLayout}>
      <PressableNative
        style={[
          styles.button,
          {
            borderRadius: layout.width * COVER_CARD_RADIUS,
            backgroundColor,
          },
        ]}
        onPress={onPress}
        accessibilityRole="button"
      >
        {item?.smallURI ? (
          <View
            style={[
              {
                borderRadius: layout.width * COVER_CARD_RADIUS,
                overflow: 'hidden',
                aspectRatio: imageRatio,
              },
            ]}
          >
            {svgMode ? (
              <CardModuleBackgroundImage
                layout={layout}
                resizeMode={resizeMode}
                backgroundUri={item.smallURI}
                patternColor={tintColor}
                backgroundOpacity={1}
              />
            ) : (
              <Image
                source={{ uri: item?.smallURI }}
                style={[
                  styles.image,
                  {
                    backgroundColor,
                    tintColor,
                    aspectRatio: imageRatio,
                  },
                ]}
              />
            )}
          </View>
        ) : (
          <View
            style={[
              styles.image,
              styles.nullImage,
              {
                borderRadius: layout.width * COVER_CARD_RADIUS,
                backgroundColor,
                aspectRatio: imageRatio,
              },
            ]}
          />
        )}
      </PressableNative>
    </Animated.View>
  );
};

const StaticMediaListItemMemo = memo(StaticMediaListItem);
