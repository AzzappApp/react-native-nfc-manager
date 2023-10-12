import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import {
  addListener,
  getAssetInfoAsync,
  getAssetsAsync,
  removeAllListeners,
} from 'expo-media-library';
import { useCallback, useRef, useState, useEffect, memo } from 'react';
import { useIntl } from 'react-intl';
import { useWindowDimensions, View } from 'react-native';
import { ScrollView, PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import {
  formatVideoTime,
  getImageSize,
  getVideoSize,
} from '#helpers/mediaHelpers';
import useScreenInsets from '#hooks/useScreenInsets';
import { HEADER_HEIGHT } from '#ui/Header';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import type { Media } from './imagePickerTypes';

import type { FlashListProps, ListRenderItemInfo } from '@shopify/flash-list';
import type { Album, Asset } from 'expo-media-library';
import type { LayoutChangeEvent } from 'react-native';
import type { PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
type PhotoGalleryMediaListProps = Omit<
  FlashListProps<Asset>,
  'children' | 'data' | 'onEndReached' | 'renderItem'
> & {
  /**
   * The ID of the media that is currently selected.
   * this id is the uri of the media as in camera roll (phassets on ios).
   */
  selectedMediaID?: string;
  /**
   * The kind of media to display.
   */
  kind: 'image' | 'mixed' | 'video';
  /**
   * Allows the list to be filtered by album.
   */
  album: Album | null;
  /**
   * Called when the user selects a media.
   * @param media The media that was selected.
   */
  onMediaSelected: (media: Media) => void;
  /**autoSelectFirstItem */
  autoSelectFirstItem?: boolean;
};

const AnimatedFlashList =
  Animated.createAnimatedComponent<FlashListProps<Asset>>(FlashList);

/**
 * A component that displays a list of media from the camera roll
 * and allows the user to select one of them.
 */
const PhotoGalleryMediaList = ({
  selectedMediaID,
  album,
  kind,
  onMediaSelected,
  autoSelectFirstItem = true,
  numColumns = 4,
  contentContainerStyle,
  ...props
}: PhotoGalleryMediaListProps) => {
  const { height: windowsHeight } = useWindowDimensions();
  const scrollViewRef = useRef<FlashList<Asset>>(null);
  const panRef = useRef();
  const styles = useStyleSheet(styleSheet);
  const [medias, setMedias] = useState<Asset[]>([]);
  const isLoading = useRef(false);
  const [hasNext, setHasNext] = useState(false);
  const nextCursor = useRef<string | undefined>();
  const topPosition = useScreenInsets().top + HEADER_HEIGHT;

  const load = useCallback(
    async (refreshing = false) => {
      if (!isLoading.current) {
        isLoading.current = true;
        const previous = refreshing ? [] : [...medias];
        try {
          const result = await getAssetsAsync({
            first: refreshing ? 16 : 60, //multiple of items per row
            after: refreshing ? undefined : nextCursor.current,
            mediaType:
              kind === 'mixed'
                ? ['photo', 'video']
                : kind === 'image'
                ? ['photo']
                : ['video'],
            sortBy: ['creationTime'],
            album: album ?? undefined,
          });

          const { assets, endCursor, hasNextPage } = result;
          setMedias([...previous, ...assets]);
          nextCursor.current = endCursor;
          setHasNext(hasNextPage);
        } catch (e) {
          console.log(e);
          return;
        } finally {
          isLoading.current = false;
        }
      }
    },
    [album, kind, medias],
  );

  useEffect(() => {
    //force preload more data and inital render,
    if (medias.length === 16 && hasNext) {
      void load(false);
    }
  }, [hasNext, load, medias.length]);

  useEffect(() => {
    if (!isLoading.current) {
      nextCursor.current = undefined;
      setHasNext(false);
      void load(true);
    }
  }, [album, load]);

  useEffect(() => {
    void load(true);
  }, [load]);

  const onMediaPress = useCallback(
    async (asset: Asset) => {
      let uri: string | null = asset.uri;
      const assets = await getAssetInfoAsync(asset.id);
      uri = assets.localUri ?? uri;

      if (uri == null) {
        // TODO
        return;
      }
      let { width, height } = asset;
      if (asset.mediaType === 'video') {
        if (asset.width == null || asset.height == null) {
          ({ width, height } = await getVideoSize(uri));
        }
        onMediaSelected({
          galleryUri: asset.uri,
          kind: 'video',
          uri,
          width,
          height,
          duration: asset.duration,
        });
      } else {
        if (width == null || height == null) {
          ({ width, height } = await getImageSize(uri));
        }
        onMediaSelected({
          galleryUri: asset.uri,
          kind: 'image',
          uri,
          width,
          height,
        });
      }
    },
    [onMediaSelected],
  );

  const onEndReached = useCallback(() => {
    if (hasNext && !isLoading.current) {
      void load();
    }
  }, [hasNext, isLoading, load]);

  const itemHeight =
    (useWindowDimensions().width - (numColumns - 1 * SEPARATOR_WIDTH)) /
    numColumns;

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Asset>) => (
      <MemoPhotoGalleyMediaItem
        item={item}
        selected={selectedMediaID === item.id}
        height={itemHeight}
        onMediaPress={onMediaPress}
      />
    ),

    [itemHeight, onMediaPress, selectedMediaID],
  );

  const initialPosition = useRef(0);
  const maxHeight = useRef(0);
  const translateY = useSharedValue(0);

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      if (initialPosition.current === 0) {
        initialPosition.current =
          windowsHeight - event.nativeEvent.layout.height;
        maxHeight.current = event.nativeEvent.layout.height;
      }
    },
    [windowsHeight],
  );

  const scrollY = useSharedValue(0);
  const scrollTo = (offset: number) => {
    scrollViewRef.current?.scrollToOffset({ offset, animated: false });
  };

  const onScroll = useAnimatedScrollHandler({
    onScroll: event => {
      scrollY.value = event.contentOffset.y;
    },
  });

  //determine the position, 0 for not translate, 1 for upper
  const position = useSharedValue(0);
  // pan handler for sheet
  const eventHandler = useAnimatedGestureHandler<
    PanGestureHandlerGestureEvent,
    {
      startY: number;
      panActive: boolean;
      saveOffset: number;
      startTranslationY: number;
    }
  >({
    onStart: (event, ctx) => {
      ctx.startY = event.y;
      ctx.panActive = false;
      ctx.startTranslationY = translateY.value;
    },
    onActive: (event, ctx) => {
      if (position.value === 0) {
        if (event.y < -30) {
          ctx.panActive = true;
          ctx.saveOffset = scrollY.value;
        } else if (event.y > ctx.startY) {
          ctx.panActive = false;
        }
        if (ctx.panActive) {
          translateY.value = -event.translationY - ctx.startY - 30;
          runOnJS(scrollTo)(ctx.saveOffset);
        }
      } else if (scrollY.value < 0 && translateY.value > 0) {
        ctx.panActive = true;
        runOnJS(scrollTo)(0);
        translateY.value = Math.max(
          0,
          ctx.startTranslationY - event.translationY,
        );
      }
    },
    onEnd: (event, ctx) => {
      if (ctx.panActive) {
        if (
          event.absoluteY <
          (windowsHeight - initialPosition.current) / 2 + topPosition
        ) {
          translateY.value = withSpring(initialPosition.current - topPosition);
          position.value = 1;
        } else {
          translateY.value = withSpring(0);
          position.value = 0;
        }
      }
    },
  });

  const animatedViewStyle = useAnimatedStyle(() => {
    return {
      //transformY: translateY.value,
      transform: [{ translateY: -translateY.value }],
      minHeight: maxHeight.current + translateY.value,
    };
  });

  useEffect(() => {
    translateY.value = withSpring(0);
    position.value = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMediaID]);

  //should select the first media when the list if no media is selected
  useEffect(() => {
    if (autoSelectFirstItem && selectedMediaID == null && medias?.length > 0) {
      void onMediaPress(medias[0]);
    }
  }, [autoSelectFirstItem, medias, onMediaPress, selectedMediaID]);

  useEffect(() => {
    addListener(() => {
      load(true);
    });

    return () => {
      removeAllListeners();
    };
  }, [load]);

  return (
    <PanGestureHandler onGestureEvent={eventHandler} ref={panRef}>
      <Animated.View
        onLayout={onLayout}
        style={[
          styles.container,
          {
            minHeight: maxHeight.current ?? 0,
          },
          animatedViewStyle,
        ]}
      >
        <AnimatedFlashList
          ref={scrollViewRef}
          overrideProps={{
            simultaneousHandlers: panRef,
          }}
          numColumns={numColumns}
          data={medias}
          showsVerticalScrollIndicator={false}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          onEndReachedThreshold={medias.length <= 16 ? 0.1 : 1.5}
          drawDistance={1200} //this value will need tweaking with android low end device
          onEndReached={onEndReached}
          accessibilityRole="list"
          contentContainerStyle={contentContainerStyle}
          ItemSeparatorComponent={() => (
            <View style={{ width: SEPARATOR_WIDTH, height: SEPARATOR_WIDTH }} />
          )}
          {...props}
          estimatedItemSize={itemHeight}
          renderScrollComponent={ScrollView}
          onScroll={onScroll}
          testID="photo-gallery-list"
        />
      </Animated.View>
    </PanGestureHandler>
  );
};

const keyExtractor = (item: Asset) => item.id;

// This list can be a litle laggy (due to the library we use for image at the moment). Using the RN preconisation for this list to try to improve a bit
type PhotoGalleyMediaItemProps = {
  item: Asset;
  height: number;
  selected: boolean;
  onMediaPress: (media: Asset) => void;
};
const PhotoGalleyMediaItem = ({
  item,
  selected,
  height,
  onMediaPress,
}: PhotoGalleyMediaItemProps) => {
  const intl = useIntl();
  const styles = useStyleSheet(styleSheet);

  const onPress = useCallback(() => {
    onMediaPress(item);
  }, [item, onMediaPress]);

  return (
    <PressableNative
      style={[
        {
          aspectRatio: 1,
          height,
        },
        selected && {
          opacity: 0.5,
        },
      ]}
      accessibilityRole="button"
      accessibilityHint={intl.formatMessage({
        defaultMessage: 'tap to select this media',
        description:
          'accessibility hint for media selection buttons in photo gallery',
      })}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Image
        accessibilityRole="image"
        accessibilityIgnoresInvertColors={true}
        style={{
          width: height,
          height,
        }}
        source={{ uri: item.uri, width: height, height }}
        recyclingKey={item.id}
      />
      {item.mediaType === 'video' && (
        <Text variant="button" style={styles.textDuration}>
          {formatVideoTime(item.duration)}
        </Text>
      )}
    </PressableNative>
  );
};

const MemoPhotoGalleyMediaItem = memo(PhotoGalleyMediaItem);

export default PhotoGalleryMediaList;

const styleSheet = createStyleSheet(appearance => ({
  container: {
    flex: 1,
    backgroundColor: appearance === 'light' ? colors.white : colors.black,
  },
  textDuration: { position: 'absolute', bottom: 10, right: 10, color: 'white' },
  flatListStyle: { flex: 1 },
}));

const SEPARATOR_WIDTH = 1;
