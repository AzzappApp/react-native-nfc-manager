import { useCallback } from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors, textStyles } from '#theme';
import PressableBackground from '#ui/PressableBackground';
import type { StyleProp, ViewStyle } from 'react-native';

export type TagCatoryItem = {
  id: string;
  label: string;
};
type TagCategoryProps = {
  item: TagCatoryItem;
  onPress: (item: TagCatoryItem) => void;
  selected: boolean;
  style?: StyleProp<ViewStyle>;
};

const TagCategory = ({
  item,
  selected,
  onPress,
  style = {},
}: TagCategoryProps) => {
  const toggleSelected = useCallback(() => {
    onPress(item);
  }, [item, onPress]);

  return (
    <PressableBackground
      testID="azzapp_TagCategory_pressable-wrapper"
      onPress={toggleSelected}
      highlightColor={undefined}
      style={[
        styles.container,
        selected
          ? { backgroundColor: colors.black }
          : { backgroundColor: 'transparent' },
        style,
      ]}
    >
      <Text
        style={{
          ...textStyles.button,
          textAlignVertical: 'center',
          color: selected ? 'white' : colors.black,
        }}
      >
        {item.label}
      </Text>
    </PressableBackground>
  );
};

export default TagCategory;

const styles = StyleSheet.create({
  container: {
    paddingLeft: 20,
    paddingRight: 20,
    height: 35,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 9,
    marginBottom: 9,
    overflow: 'hidden',
  },
});
