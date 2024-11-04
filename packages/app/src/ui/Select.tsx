import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Text from '#ui/Text';
import BottomSheetModal from './BottomSheetModal';
import Icon from './Icon';
import PressableNative from './PressableNative';
import SelectList from './SelectList';
import type { SelectListItemInfo } from './SelectList';
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from 'react-native';

export type SelectItemInfo<ItemT> = SelectListItemInfo<ItemT> & {
  /**
   * Whether the rendered item is in the dropdown list or in the input
   */
  isInputElement?: boolean;
};

type SelectProps<ItemT> = Omit<ViewProps, 'children'> & {
  /**
   * The list of elements to display in the Dropdown list / BottomSheet
   */
  data: readonly ItemT[];
  /**
   * Used to extract a unique key for a given item at the specified index. Key is used for caching
   * and as the react key to track item re-ordering. The default extractor checks `item.key`, then
   * falls back to using the index, like React does.
   */
  keyExtractor: (item: ItemT, index: number) => string;

  /**
   * Component to render at the top of the list
   */
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;

  /**
   * The selected item key
   */
  selectedItemKey?: string | null;

  /**
   * Callback called when an item is selected
   */
  onItemSelected: (item: ItemT) => void;

  /**
   * Render the item in the dropdown list and the item in the input
   */
  renderItem?: (itemInfo: SelectItemInfo<ItemT>) => React.ReactElement | null;

  /**
   * label field used for the default item renderer, default to 'label'
   */
  labelField?: keyof ItemT;

  /**
   * Placeholder text
   */
  placeHolder?: string;

  /**
   * The height of the bottom sheet that will be displayed when the dropdown is opened
   */
  bottomSheetHeight?: number;

  /**
   * Title displayed in the bottom sheet header
   */
  bottomSheetTitle?: string;

  /**
   * Whether the input is in error state
   */
  isErrored?: boolean;

  /**
   * Style of the item container in the dropdown list
   */
  itemContainerStyle?: StyleProp<ViewStyle>;

  /**
   * Style of the item container when it is selected in the dropdown list
   */
  selectedItemContainerStyle?: StyleProp<ViewStyle>;

  /**
   * Style of the input text line
   * */
  inputTextStyle?: StyleProp<TextStyle>;

  /**
   * Whether the select is disabled
   */
  disabled?: boolean;

  avoidKeyboard?: boolean;
};

/**
 * A dropdown list component that display a list of items in a bottom sheet
 *
 */
const Select = <ItemT,>({
  data,
  labelField = 'label' as any,
  keyExtractor,
  renderItem,
  selectedItemKey,
  onItemSelected,
  placeHolder,
  bottomSheetTitle,
  bottomSheetHeight,
  itemContainerStyle,
  selectedItemContainerStyle,
  isErrored,
  inputTextStyle,
  style,
  ListHeaderComponent,
  avoidKeyboard,
  ...props
}: SelectProps<ItemT>) => {
  const [showDropDown, setShowDropDown] = useState(false);

  const selectedItemIndex = data.findIndex(
    (item, index) => selectedItemKey === keyExtractor(item, index),
  );

  const styles = useStyleSheet(styleSheet);
  const inputChildren = useMemo(() => {
    const selectedItem = data[selectedItemIndex];
    if (!selectedItem) {
      return null;
    }
    if (renderItem) {
      return renderItem({
        item: selectedItem,
        index: selectedItemIndex,
        isInputElement: true,
        isSelected: true,
      });
    }
    const label = (selectedItem as any)[labelField ?? 'label'];
    return (
      <Text variant="textField" style={[styles.inputText, inputTextStyle]}>
        {label}
      </Text>
    );
  }, [
    data,
    selectedItemIndex,
    renderItem,
    labelField,
    styles.inputText,
    inputTextStyle,
  ]);

  const onSelectListItemSelected = useCallback(
    (item: ItemT) => {
      setShowDropDown(false);
      onItemSelected(item);
    },
    [onItemSelected],
  );

  return (
    <>
      <PressableNative
        onPress={() => setShowDropDown(true)}
        style={[styles.input, isErrored && styles.error, style]}
        accessibilityRole="combobox"
        {...props}
      >
        {inputChildren != null ? (
          inputChildren
        ) : placeHolder ? (
          <Text variant="textField" style={styles.placeholder}>
            {placeHolder}
          </Text>
        ) : (
          <View />
        )}
        {props.disabled ? null : (
          <Icon
            icon="arrow_down"
            style={{
              width: 11,
              height: 43,
              marginLeft: 10,
              marginRight: 10,
            }}
          />
        )}
      </PressableNative>
      <BottomSheetModal
        visible={showDropDown}
        headerTitle={bottomSheetTitle}
        height={bottomSheetHeight}
        variant="modal"
        contentContainerStyle={styles.bottomSheetContentContainer}
        onRequestClose={() => setShowDropDown(false)}
        nestedScroll
        avoidKeyboard={avoidKeyboard}
      >
        <SelectList
          data={data}
          keyExtractor={keyExtractor}
          selectedItemKey={selectedItemKey}
          renderItem={renderItem}
          labelField={labelField}
          onItemSelected={onSelectListItemSelected}
          itemContainerStyle={itemContainerStyle}
          selectedItemContainerStyle={selectedItemContainerStyle}
          ListHeaderComponent={ListHeaderComponent}
        />
      </BottomSheetModal>
    </>
  );
};

export default Select;

const styleSheet = createStyleSheet(appearance => ({
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 43,
    backgroundColor: appearance === 'light' ? colors.grey50 : colors.grey1000,
    borderColor: appearance === 'light' ? colors.grey50 : colors.grey1000,
    borderRadius: 12,
    paddingLeft: 20,
    paddingRight: 20,
    borderWidth: 1,
  },
  inputText: {
    color: appearance === 'light' ? colors.black : colors.white,
  },
  placeholder: {
    color: appearance === 'light' ? colors.grey400 : colors.grey400,
  },
  bottomSheetContentContainer: {
    paddingHorizontal: 0,
    marginHorizontal: 0,
    backgroundColor: appearance === 'light' ? colors.white : colors.black,
  },
  error: {
    borderColor: colors.red400,
  },
}));
