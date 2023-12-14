import { memo, useCallback, useMemo, useState } from 'react';
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
  const [itemDimension, setItemDimension] = useState({ width: 0, height: 0 });
  const onLayout = useCallback(
    (e: LayoutChangeEvent) => {
      //when scalling up the item, it is calling the onLayout.Limit rerender
      if (e.nativeEvent.layout.height !== itemDimension.height) {
        setItemDimension({
          height: e.nativeEvent.layout.height,
          width: e.nativeEvent.layout.height * imageRatio,
        });
      }
    },
    [imageRatio, itemDimension.height],
  );

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
            dimension={itemDimension}
          />
        );
      }
      return null;
    },
    [
      backgroundColor,
      imageRatio,
      itemDimension,
      onSelectMedia,
      selectedMedia,
      svgMode,
      tintColor,
    ],
  );

  const data = useMemo(() => {
    if (itemDimension.height !== 0) {
      return [null, ...staticMedias];
    }
  }, [itemDimension.height, staticMedias]);

  const getItemLayout = useCallback(
    (_data: any, index: number) => {
      return {
        length: itemDimension.width + 10,
        offset: itemDimension.width * index,
        index,
      };
    },
    [itemDimension.width],
  );

  return (
    <FlatList
      onLayout={onLayout}
      data={data}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.flatListStyle, style]}
      renderItem={renderItem}
      testID={testID}
      accessibilityRole="list"
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}
      ItemSeparatorComponent={ItemSeparatorComponent}
      contentInset={{ left: 30 }}
      contentOffset={{ x: -30, y: 0 }}
      maxToRenderPerBatch={2}
    />
  );
};

const ItemSeparatorComponent = () => <View style={{ width: 10 }} />;

const keyExtractor = (
  item: ArrayItemType<StaticMediaList_staticMedias$data> | null,
) => item?.id ?? 'first_item_key';

export default StaticMediaList;

const styleSheet = createStyleSheet(appearance => ({
  flatListStyle: { overflow: 'visible' },

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
  dimension: { width: number; height: number };
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
  dimension,
}: StaticMediaListItemProps) => {
  const timing = useAnimatedState(isSelected, { duration: 120 });

  const itemAnimatedStyle = useAnimatedStyle(() => {
    return {
      height: dimension.height,
      aspectRatio: imageRatio,
      transform: [{ scale: interpolate(timing.value, [0, 1], [1, 1.1]) }],
    };
  }, [dimension, imageRatio, timing]);
  const styles = useStyleSheet(styleSheet);

  const onPress = useCallback(() => {
    onSelectMedia(item.id);
  }, [item.id, onSelectMedia]);

  const visiblebackgroundColor = useMemo(() => {
    if (tintColor === colors.white && backgroundColor === colors.white) {
      return colors.grey200;
    }
    return backgroundColor;
  }, [backgroundColor, tintColor]);

  return (
    <Animated.View style={[itemAnimatedStyle]}>
      <PressableNative
        style={[
          styles.button,
          {
            borderRadius: dimension.width * COVER_CARD_RADIUS,
            backgroundColor: visiblebackgroundColor,
          },
        ]}
        onPress={onPress}
        accessibilityRole="button"
      >
        {item?.smallURI ? (
          <View
            style={[
              {
                borderRadius: dimension.width * COVER_CARD_RADIUS,
                overflow: 'hidden',
                aspectRatio: imageRatio,
              },
            ]}
          >
            {svgMode ? (
              <CardModuleBackgroundImage
                layout={dimension}
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
                    backgroundColor: visiblebackgroundColor,
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
                borderRadius: dimension.width * COVER_CARD_RADIUS,
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
