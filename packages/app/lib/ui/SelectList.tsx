import { useCallback } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { colors } from '../theme';
import PressableBackground from './PressableBackground';
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
        <PressableBackground
          style={[styles.item, isSelected && styles.itemSelected]}
          onPress={() => onChange(item)}
        >
          {renderItem(item, isSelected)}
        </PressableBackground>
      );
    },
    [onChange, renderItem, selectedItem],
  );
  return (
    <FlatList
      accessibilityRole="list"
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
  itemSelected: {
    backgroundColor: colors.orange,
  },
});
