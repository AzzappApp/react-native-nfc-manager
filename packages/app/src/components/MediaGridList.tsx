import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import memoize from 'lodash/memoize';
import range from 'lodash/range';
import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet, useColorScheme, View } from 'react-native';
import { colors } from '#theme';
import { formatVideoTime } from '#helpers/mediaHelpers';
import ActivityIndicator from '#ui/ActivityIndicator';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import Skeleton from './Skeleton';
import type { ContentStyle, ListRenderItemInfo } from '@shopify/flash-list';
import type { ViewProps } from 'react-native';

type MediaGridListProps<T> = Omit<ViewProps, 'children'> & {
  medias: T[];
  selectedMediaIds: string[] | null;
  filesDownloading: string[] | null;
  refreshing: boolean;
  isLoadingMore?: boolean;
  numColumns: number;
  width: number;
  contentContainerStyle?: ContentStyle;
  getItemId: (item: T) => string;
  getItemUri: (item: T) => string;
  getItemDuration: (item: T) => number | undefined;
  onSelect: (media: T) => void;
  onEndReached?: (() => void) | null | undefined;
};

const MediaGridList = <T,>({
  medias,
  selectedMediaIds,
  filesDownloading,
  refreshing,
  isLoadingMore,
  numColumns,
  width,
  contentContainerStyle,
  getItemId,
  getItemUri,
  getItemDuration,
  onEndReached,
  onSelect,
  ...props
}: MediaGridListProps<T>) => {
  const scrollViewRef = useRef<FlashList<any>>(null);
  const wasRefreshing = useRef(refreshing);
  useEffect(() => {
    if (wasRefreshing.current && !refreshing) {
      scrollViewRef.current?.scrollToOffset({ offset: 0 });
    }
    wasRefreshing.current = refreshing;
  }, [refreshing]);

  const itemHeight = (width - (numColumns - 1 * SEPARATOR_WIDTH)) / numColumns;

  const memoizedOnSelect = useMemo(
    () => memoize((item: T) => () => onSelect(item)),
    [onSelect],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<T>) => {
      const id = getItemId(item);
      return (
        <MemoMediaItemRenderer
          uri={getItemUri(item)}
          duration={getItemDuration(item)}
          selected={selectedMediaIds?.includes(id) ?? false}
          isLoading={filesDownloading?.includes(id) ?? false}
          height={itemHeight}
          onPress={memoizedOnSelect(item)}
        />
      );
    },
    [
      getItemId,
      getItemUri,
      getItemDuration,
      selectedMediaIds,
      filesDownloading,
      itemHeight,
      memoizedOnSelect,
    ],
  );

  const extraData = useMemo(
    () => ({
      getItemId,
      getItemUri,
      getItemDuration,
      selectedMediaIds,
      filesDownloading,
      itemHeight,
      memoizedOnSelect,
      isLoadingMore,
    }),
    [
      getItemId,
      getItemUri,
      getItemDuration,
      selectedMediaIds,
      filesDownloading,
      itemHeight,
      memoizedOnSelect,
      isLoadingMore,
    ],
  );

  const ListFooterComponent = useMemo(
    () =>
      isLoadingMore ? (
        <View style={styles.loadingMore}>
          <ActivityIndicator />
        </View>
      ) : null,
    [isLoadingMore],
  );

  return (
    <FlashList
      ref={scrollViewRef}
      numColumns={numColumns}
      data={medias}
      showsVerticalScrollIndicator={false}
      keyExtractor={getItemId}
      renderItem={renderItem}
      onEndReachedThreshold={medias.length <= 16 ? 0.1 : 0.5}
      drawDistance={1200} //this value will need tweaking with android low end device
      onEndReached={onEndReached}
      accessibilityRole="list"
      contentContainerStyle={contentContainerStyle}
      ItemSeparatorComponent={ItemSeparatorComponent}
      estimatedItemSize={itemHeight}
      testID="photo-gallery-list"
      ListFooterComponent={ListFooterComponent}
      extraData={extraData}
      {...props}
    />
  );
};

export default MediaGridList;

type MediaItemRendererProps = {
  uri: string;
  duration?: number;
  height: number;
  selected: boolean;
  isLoading: boolean;
  disabled?: boolean;
  onPress: () => void;
};

const selectedBorderWidth = 2;

const MediaItemRenderer = ({
  uri,
  duration,
  selected,
  height,
  isLoading,
  disabled,
  onPress,
}: MediaItemRendererProps) => {
  const intl = useIntl();
  const appearance = useColorScheme();

  return (
    <PressableNative
      style={{
        aspectRatio: 1,
        height,
        position: 'relative',
        backgroundColor:
          appearance === 'light' ? colors.grey200 : colors.grey900,
      }}
      accessibilityRole="button"
      accessibilityHint={intl.formatMessage({
        defaultMessage: 'tap to select this Media',
        description:
          'accessibility hint for Media selection buttons in photo gallery',
      })}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled}
    >
      {/* intermediate view added to workaround: https://github.com/expo/expo/issues/32814 */}
      <View
        style={[
          {
            width: height,
            height,
            backgroundColor:
              appearance === 'light' ? colors.grey200 : colors.grey900,
          },
          selected && {
            borderWidth: selectedBorderWidth,
            borderColor: colors.black,
            borderRadius: 8,
            transformOrigin: 'center',
            transform: [{ scale: 0.95 }],
          },
        ]}
      >
        <Image
          accessibilityRole="image"
          accessibilityIgnoresInvertColors={true}
          style={
            selected
              ? {
                  width: height - 2 * selectedBorderWidth,
                  height: height - 2 * selectedBorderWidth,
                  borderRadius: 6,
                }
              : {
                  width: height,
                  height,
                }
          }
          source={{ uri, width: height, height }}
          recyclingKey={uri}
        />
      </View>
      {isLoading && (
        <View style={styles.loader}>
          <ActivityIndicator color="white" />
        </View>
      )}
      {duration != null && (
        <Text variant="button" style={styles.textDuration}>
          {formatVideoTime(duration)}
        </Text>
      )}
    </PressableNative>
  );
};

const ItemSeparatorComponent = () => <View style={styles.separator} />;

const MemoMediaItemRenderer = memo(MediaItemRenderer);

const SEPARATOR_WIDTH = 1;

export const MediaGridListFallback = memo(function MediaGridListFallback({
  numColumns,
  width,
}: {
  numColumns: number;
  width: number;
}) {
  const items = range(0, 50);
  const itemSize = (width - (numColumns - 1 * SEPARATOR_WIDTH)) / numColumns;
  return (
    <View style={styles.gridPlaceHolder}>
      {items.map((item, index) => (
        <Skeleton key={index} style={{ width: itemSize, height: itemSize }} />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  textDuration: { position: 'absolute', bottom: 10, right: 10, color: 'white' },
  loader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingMore: { justifyContent: 'center', alignItems: 'center' },
  separator: { width: SEPARATOR_WIDTH, height: SEPARATOR_WIDTH },
  gridPlaceHolder: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SEPARATOR_WIDTH,
  },
});
