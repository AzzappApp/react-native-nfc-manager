import { useCallback } from 'react';
import { FlatList, StyleSheet, Text } from 'react-native';
import { colors, fontFamilies } from '#theme';
import PressableBackground from './PressableBackground';
import type {
  StyleProp,
  ViewStyle,
  ListRenderItemInfo,
  FlatListProps,
} from 'react-native';

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
  selected: boolean;
};

export type SelectListProps<ItemT> = Omit<
  FlatListProps<ItemT>,
  'children' | 'keyExtractor' | 'renderItem'
> & {
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
   * label field used for the default item renderer, default to 'label'
   */
  labelField?: keyof ItemT;

  /**
   * Style of the item container
   */
  itemContainerStyle?: StyleProp<ViewStyle>;
  /**
   * Style of the item container when it is selected
   */
  selectedItemContainerStyle?: StyleProp<ViewStyle>;
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
        <PressableBackground
          style={[
            itemContainerStyle ?? styles.itemContainer,
            isSelected &&
              (selectedItemContainerStyle ?? styles.selectedItemContainer),
          ]}
          onPress={() => onItemSelected(item)}
        >
          {renderItem?.({ item, selected: isSelected, index }) ?? (
            <Text style={styles.defaultItemRenderer}>
              {(item as any)?.[labelField]}
            </Text>
          )}
        </PressableBackground>
      );
    },
    [
      itemContainerStyle,
      keyExtractor,
      labelField,
      onItemSelected,
      renderItem,
      selectedItemKey,
      selectedItemContainerStyle,
    ],
  );
  return (
    <FlatList
      accessibilityRole="list"
      data={data}
      keyExtractor={keyExtractor}
      renderItem={renderListItem}
      {...props}
    />
  );
}

export default SelectList;

const styles = StyleSheet.create({
  itemContainer: {
    backgroundColor: 'white',
    marginBottom: 18,
    paddingHorizontal: 30,
  },
  selectedItemContainer: {
    backgroundColor: colors.grey50,
  },
  defaultItemRenderer: {
    ...fontFamilies.semiBold,
    fontSize: 16,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
