import { memo, useCallback } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { colors, shadow } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { keyExtractor } from '#helpers/idHelpers';
import PressableScaleHighlight from '#ui/PressableScaleHighlight';
import Text from '#ui/Text';
import type { ReactNode } from 'react';
import type {
  FlatListProps,
  ListRenderItemInfo,
  ViewStyle,
} from 'react-native';

export type CoverEditorSelectionList<T> = T & { id: string; label: string };

export type CoverEditorSelectionListProps<T> = Omit<
  FlatListProps<CoverEditorSelectionList<T>>,
  'getItemLayout' | 'hitSlop' | 'keyExtractor' | 'renderItem'
> & {
  selectedItemId: string;
  onSelect: (id: string) => void;
  renderItem: (params: CoverEditorSelectionList<T>) => ReactNode;
};

const CoverEditorSelectionList = <T,>({
  selectedItemId,
  renderItem,
  onSelect,
  onLayout,
  ...props
}: CoverEditorSelectionListProps<T>) => {
  const styles = useStyleSheet(styleSheet);

  const renderItemList = useCallback(
    ({ item }: ListRenderItemInfo<CoverEditorSelectionList<T>>) => {
      return (
        <SelectionListItemMemo
          item={item}
          renderItem={renderItem}
          isSelected={selectedItemId === item.id}
          onSelect={onSelect}
        />
      );
    },
    [renderItem, selectedItemId, onSelect],
  );

  return (
    <View style={styles.container}>
      <FlatList
        {...props}
        renderItem={renderItemList}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContentContainer}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
      />
    </View>
  );
};

export default CoverEditorSelectionList;

const getItemLayout = (_data: unknown, index: number) => ({
  length: BOX_WIDTH + 10,
  offset: BOX_WIDTH + 10 * index,
  index,
});

type ItemProps<T> = {
  item: CoverEditorSelectionList<T>;
  renderItem: (params: CoverEditorSelectionList<T>) => React.ReactNode;
  isSelected: boolean;
  onSelect: (item: string) => void;
};

const ListItem = <T,>({
  item,
  isSelected,
  onSelect,
  renderItem,
}: ItemProps<T>) => {
  const onPress = useCallback(() => {
    onSelect(item.id);
  }, [onSelect, item]);

  const styles = useStyleSheet(styleSheet);

  return (
    <View style={styles.itemContainer}>
      <PressableScaleHighlight
        style={styles.button}
        onPress={onPress}
        accessibilityRole="button"
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        <View style={styles.viewItem}>{renderItem(item)}</View>
      </PressableScaleHighlight>
      {isSelected && (
        <>
          <View style={styles.buttonOuterBorder} pointerEvents="none" />
          <View style={styles.buttonInnerBorder} pointerEvents="none" />
        </>
      )}
      <Text
        variant="small"
        style={styles.label}
        numberOfLines={1}
        adjustsFontSizeToFit
        ellipsizeMode="tail"
      >
        {item.label}
      </Text>
    </View>
  );
};

const SelectionListItemMemo: <T>(props: ItemProps<T>) => React.ReactNode = memo(
  ListItem,
) as any;

const VERTICAL_PADDING = 27;
const ITEM_HEIGHT = 105;
export const BOX_WIDTH = 80;
export const BORDER_RADIUS_RATIO = (BOX_WIDTH * 12) / 80;

const styleSheet = createStyleSheet(appearance => ({
  container: { height: ITEM_HEIGHT + 2 * VERTICAL_PADDING },
  listContentContainer: {
    paddingTop: VERTICAL_PADDING,
    paddingHorizontal: 20,
    height: ITEM_HEIGHT + 2 * VERTICAL_PADDING,
  },
  viewItem: {
    width: BOX_WIDTH,
    height: BOX_WIDTH,
    borderRadius: BORDER_RADIUS_RATIO,
    overflow: 'hidden',
    borderCurve: 'continuous',
  },
  button: [
    {
      position: 'absolute',
      top: 5,
      left: 5,
      backgroundColor: appearance === 'dark' ? colors.grey900 : colors.grey200,
      borderCurve: 'continuous',
      width: BOX_WIDTH,
      height: BOX_WIDTH,
      borderRadius: BORDER_RADIUS_RATIO,
    },
    Platform.select<ViewStyle>({
      default: {
        overflow: 'visible',
        ...shadow(appearance),
      },
      android: {
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: appearance === 'dark' ? colors.grey800 : colors.grey100,
        overflow: 'hidden',
        elevation: 0,
      },
    }),
  ],
  buttonInnerBorder: {
    position: 'absolute',
    top: 3,
    left: 3,
    borderWidth: 2,
    borderColor: appearance === 'dark' ? colors.black : colors.white,
    borderCurve: 'continuous',
    height: BOX_WIDTH + 4,
    width: BOX_WIDTH + 4,
    borderRadius: BORDER_RADIUS_RATIO + 2,
  },
  buttonOuterBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderWidth: 3,
    borderColor: appearance === 'dark' ? colors.white : colors.black,
    borderCurve: 'continuous',
    height: BOX_WIDTH + 10,
    width: BOX_WIDTH + 10,
    borderRadius: BORDER_RADIUS_RATIO + 5,
  },
  label: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    textAlign: 'center',
  },
  itemContainer: {
    height: ITEM_HEIGHT,
    width: BOX_WIDTH + 10,
  },
}));
