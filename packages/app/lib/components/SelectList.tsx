import { useCallback } from 'react';
import { FlatList, Pressable, StyleSheet } from 'react-native';
import { colors } from '../../theme';
import type { StyleProp, ViewStyle, ListRenderItemInfo } from 'react-native';

type SelectListProps<T> = {
  selectedItem: T | null | undefined;
  items: T[];
  onChange: (index: T) => void;
  keyExtractor: (value: T) => string;
  renderItem: (value: T, selected: boolean) => React.ReactElement | null;
  style?: StyleProp<ViewStyle>;
};

function SelectList<T>({
  items,
  selectedItem,
  onChange,
  keyExtractor,
  style,
  renderItem,
}: SelectListProps<T>) {
  const renderListItem = useCallback(
    ({ item }: ListRenderItemInfo<T>) => {
      const isSelected = selectedItem === item;
      return (
        <Pressable
          style={({ pressed }) => [
            styles.item,
            pressed && styles.itemPressed,
            isSelected && styles.itemSelected,
          ]}
          onPress={() => onChange(item)}
        >
          {renderItem(item, isSelected)}
        </Pressable>
      );
    },
    [onChange, renderItem, selectedItem],
  );
  return (
    <FlatList
      data={items}
      keyExtractor={keyExtractor}
      renderItem={renderListItem}
      style={style}
      extraData={selectedItem}
      showsVerticalScrollIndicator={false}
    />
  );
}

export default SelectList;

const styles = StyleSheet.create({
  item: {
    height: 32,
    backgroundColor: 'white',
    justifyContent: 'center',
  },
  itemPressed: {
    backgroundColor: colors.grey,
  },
  itemSelected: {
    backgroundColor: colors.orange,
  },
});
