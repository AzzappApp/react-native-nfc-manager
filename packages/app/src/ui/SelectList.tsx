import { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { memo, useCallback } from 'react';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Text from '#ui/Text';
import PressableNative from './PressableNative';
import type {
  StyleProp,
  ViewStyle,
  ListRenderItemInfo,
  FlatListProps,
} from 'react-native';

export type SelectListProps<ItemT> = Omit<
  FlatListProps<ItemT>,
  'children' | 'keyExtractor' | 'renderItem'
> &
  SelectListItemCommonProps<ItemT> & {
    /**
     * Used to extract a unique key for a given item at the specified index. Key is used for caching
     * and as the react key to track item re-ordering. The default extractor checks `item.key`, then
     * falls back to using the index, like React does.
     */
    keyExtractor: (item: ItemT, index: number) => string;

    /**
     * The selected item key
     */
    selectedItemKey?: string | null | undefined;
    /**
     * should use a SectionList instead of FlatList
     *
     * @type {boolean} default = false
     */
    section?: boolean;
  };

/**
 * A component that display a list of items to an user and allow him to select one of them
 */
function SelectList<ItemT>({
  data,
  selectedItemKey,
  onItemSelected,
  keyExtractor,
  labelField = 'label' as keyof ItemT,
  renderItem,
  itemContainerStyle,
  selectedItemContainerStyle,
  ...props
}: SelectListProps<ItemT>) {
  const renderListItem = useCallback(
    ({ item, index }: ListRenderItemInfo<ItemT>) => {
      const isSelected = keyExtractor(item, index) === selectedItemKey;
      return (
        <MemoSelectListItem
          isSelected={isSelected}
          selectedItemContainerStyle={selectedItemContainerStyle}
          renderItem={renderItem}
          onItemSelected={onItemSelected}
          itemContainerStyle={itemContainerStyle}
          item={item}
          index={index}
          labelField={labelField}
        />
      );
    },
    [
      keyExtractor,
      selectedItemKey,
      selectedItemContainerStyle,
      renderItem,
      onItemSelected,
      itemContainerStyle,
      labelField,
    ],
  );
  return (
    <BottomSheetFlatList
      accessibilityRole="list"
      data={data}
      keyExtractor={keyExtractor}
      renderItem={renderListItem}
      {...props}
    />
  );
}

export default SelectList;

type SelectListItemCommonProps<ItemT> = {
  /**
   * Callback called when an item is selected
   */
  onItemSelected: (item: ItemT) => void;

  /**
   * Render the item in the list
   */
  renderItem?: (
    itemInfo: SelectListItemInfo<ItemT>,
  ) => React.ReactElement | null;

  /**
   * Style of the item container
   */
  itemContainerStyle?: StyleProp<ViewStyle>;
  /**
   * Style of the item container when it is selected
   */
  selectedItemContainerStyle?: StyleProp<ViewStyle>;

  /* label field used for the default item renderer, default to 'label'
   */
  labelField?: keyof ItemT;
};

export type SelectListItemInfo<ItemT> = {
  /**
   * The item to render
   */
  item: ItemT;
  /**
   * The index of the item in the list
   */
  index: number;
  /**
   * Whether the item is the selected one
   */
  isSelected: boolean;
};

type SelectListItemProps<ItemT> = SelectListItemCommonProps<ItemT> &
  SelectListItemInfo<ItemT>;
function SelectListItem<ItemT>({
  isSelected,
  selectedItemContainerStyle,
  itemContainerStyle,
  renderItem,
  onItemSelected,
  item,
  index,
  labelField,
}: SelectListItemProps<ItemT>) {
  const onPress = useCallback(() => {
    onItemSelected(item);
  }, [item, onItemSelected]);

  const styles = useStyleSheet(styleSheet);

  return (
    <PressableNative
      style={[
        itemContainerStyle,
        styles.itemContainer,
        isSelected &&
          (selectedItemContainerStyle ?? styles.selectedItemContainer),
      ]}
      onPress={onPress}
    >
      {renderItem?.({ item, isSelected, index }) ?? (
        <Text variant="button" style={styles.defaultItemRenderer}>
          {(item as any)?.[labelField]}
        </Text>
      )}
    </PressableNative>
  );
}

const MemoSelectListItem = memo(
  SelectListItem,
) as unknown as typeof SelectListItem;

const styleSheet = createStyleSheet(appearance => ({
  defaultItemRenderer: {
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedItemContainer: {
    backgroundColor: appearance === 'light' ? colors.grey50 : colors.grey900,
  },
  itemContainer: {
    backgroundColor: appearance === 'light' ? colors.white : colors.black,
  },
}));
