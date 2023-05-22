import { useCallback, useState } from 'react';
import { Image, Platform, StyleSheet, View, FlatList } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { graphql, useFragment } from 'react-relay';
import { COVER_CARD_RADIUS, COVER_RATIO } from '@azzapp/shared/coverHelpers';
import { colors } from '#theme';
import PressableNative from '#ui/PressableNative';
import ViewTransition from '#ui/ViewTransition';
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
      }
    `,
    mediasKey,
  );

  const [width, setWidth] = useState(0);
  const onLayout = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  };

  const borderRadius = Platform.select({
    web: `${COVER_CARD_RADIUS}%` as any,
    default: COVER_CARD_RADIUS * width,
  });

  const renderItem = useCallback(
    ({
      item,
    }: ListRenderItemInfo<ArrayItemType<StaticMediaList_staticMedias$data> | null>) => {
      // eslint-disable-next-line eqeqeq
      const selected = selectedMedia == item?.id;
      return (
        <ViewTransition
          transitionDuration={120}
          transitions={['transform']}
          style={{
            height: '100%',
            aspectRatio: imageRatio,
            transform: [{ scale: selected ? 1.1 : 1 }],
          }}
        >
          <PressableNative
            style={[styles.button, { borderRadius, backgroundColor }]}
            onPress={() => onSelectMedia(item?.id ?? null)}
            accessibilityRole="button"
          >
            {item?.smallURI ? (
              <View
                style={{
                  borderRadius,
                  overflow: 'hidden',
                  aspectRatio: imageRatio,
                }}
              >
                {svgMode ? (
                  <SvgUri
                    uri={item.smallURI}
                    color={tintColor}
                    width="100%"
                    height="100%"
                    preserveAspectRatio="xMidYMid slice"
                    style={[styles.image, { backgroundColor }]}
                    onLayout={onLayout}
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
                    onLayout={onLayout}
                  />
                )}
              </View>
            ) : (
              <View
                style={[
                  styles.image,
                  styles.nullImage,
                  { borderRadius, backgroundColor, aspectRatio: imageRatio },
                ]}
              />
            )}
          </PressableNative>
        </ViewTransition>
      );
    },
    [
      backgroundColor,
      borderRadius,
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

const styles = StyleSheet.create({
  flatListStyle: { overflow: 'visible' },
  container: {
    paddingVertical: 10,
    paddingStart: 20,
    columnGap: 10,
    alignItems: 'center',
  },
  button: {
    flex: 1,
    overflow: 'visible',
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4.69 },
    shadowRadius: 18.75,
    elevation: 3,
  },
  image: {
    height: '100%',
  },
  nullImage: {
    borderWidth: 2,
    borderColor: colors.black,
  },
});
