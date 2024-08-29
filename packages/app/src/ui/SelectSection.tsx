import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Text from '#ui/Text';
import BottomSheetModal from './BottomSheetModal';
import Icon from './Icon';
import PressableNative from './PressableNative';
import SelectSectionList from './SelectSectionList';
import type { SelectSectionListProps } from './SelectSectionList';
import type { ReactElement } from 'react';
import type {
  SectionListData,
  StyleProp,
  ViewStyle,
  ViewProps,
} from 'react-native';

type SelectProps<ItemT, SectionT> = Omit<ViewProps, 'children'> &
  SelectSectionListProps<ItemT, SectionT> & {
    ListHeaderComponent?:
      | React.ComponentType<any>
      | ReactElement
      | null
      | undefined;

    sections: Array<SectionListData<ItemT, SectionT>>;

    /**
     * Render the section header item in the dropdown list and the item in the input
     */
    renderHeaderSection?: (info: {
      section: SectionListData<ItemT, SectionT>;
    }) => React.ReactElement | null;

    /**
     * label field used for the default item renderer, default to 'label'
     */
    labelField?: keyof ItemT;

    /**
     * Label for the input
     */
    inputLabel?: string;

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

    avoidKeyboard?: boolean;
  };

/**
 * A dropdown list component that display a list of items in a bottom sheet
 *
 */
const SelectSection = <ItemT, SectionT>({
  sections,
  labelField = 'title' as keyof ItemT,
  keyExtractor,
  renderItem,
  renderHeaderSection,
  selectedItemKey,
  onItemSelected,
  inputLabel,
  placeHolder,
  bottomSheetTitle,
  bottomSheetHeight,
  itemContainerStyle,
  selectedItemContainerStyle,
  isErrored,
  style,
  ListHeaderComponent,
  avoidKeyboard,
  ...props
}: SelectProps<ItemT, SectionT>) => {
  const [showDropDown, setShowDropDown] = useState(false);

  const styles = useStyleSheet(styleSheet);

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
        {inputLabel ? (
          <Text variant="medium">{inputLabel}</Text>
        ) : (
          <Text variant="textField" style={styles.placeholder}>
            {placeHolder}
          </Text>
        )}
        <Icon
          icon="arrow_down"
          style={{
            width: 11,
            height: 43,
            marginLeft: 10,
            marginRight: 10,
          }}
        />
      </PressableNative>
      <BottomSheetModal
        visible={showDropDown}
        headerTitle={bottomSheetTitle}
        height={bottomSheetHeight}
        variant="modal"
        contentContainerStyle={styles.bottomSheetContentContainer}
        onRequestClose={() => setShowDropDown(false)}
        nestedScroll
      >
        <SelectSectionList
          sections={sections}
          renderScrollComponent={props => (
            <KeyboardAwareScrollView enabled={avoidKeyboard} {...props} />
          )}
          keyExtractor={keyExtractor}
          selectedItemKey={selectedItemKey}
          renderItem={renderItem}
          renderSectionHeader={renderHeaderSection}
          labelField={labelField}
          onItemSelected={onSelectListItemSelected}
          itemContainerStyle={itemContainerStyle}
          selectedItemContainerStyle={selectedItemContainerStyle}
          ItemSeparatorComponent={() => <View style={{ height: 20 }} />}
          SectionSeparatorComponent={() => <View style={{ height: 15 }} />}
          style={{ marginTop: 20, marginHorizontal: 30 }}
          ListHeaderComponent={ListHeaderComponent}
        />
      </BottomSheetModal>
    </>
  );
};

export default SelectSection;

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
  bottomSheetContentContainer: {
    paddingHorizontal: 0,
    marginHorizontal: 0,
    backgroundColor: appearance === 'light' ? colors.white : colors.black,
  },
  error: {
    borderColor: colors.red400,
  },
  placeholder: {
    color: appearance === 'light' ? colors.grey400 : colors.grey400,
  },
}));
