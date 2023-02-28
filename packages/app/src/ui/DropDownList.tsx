import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput as NativeTextInput,
  View,
} from 'react-native';

import { colors, fontFamilies, textStyles } from '#theme';
import Icon from './Icon';
import PressableNative from './PressableNative';
import ViewTransition from './ViewTransition';
import type {
  TextInputProps as NativeTextInputProps,
  StyleProp,
  ViewStyle,
  NativeSyntheticEvent,
  TextInputFocusEventData,
  TextStyle,
  LayoutChangeEvent,
} from 'react-native';

//Label should be translated, simple component should not have to deal with translations
export type DropDownListData = { id: string; label: string };

type DropDownListProps = {
  /**
   * Label place on top of the select text
   *
   * @type {string}
   */
  label?: string;
  /**
   * Style of the View Container wrapper around the component
   *
   * @type {StyleProp<ViewStyle>}
   */
  containerStyle?: StyleProp<ViewStyle>;
  /**
   * Max height of the dropdown list
   *
   * @type {number}
   */
  maxHeight?: number;

  selectedId?: string;

  setSelected: (item: DropDownListData) => void;
  /**
   * make the list searchable and textinput enable
   * NOT IMPLEMNETED YET
   *
   * @type {boolean}
   */
  searchable?: boolean;
  data: DropDownListData[];
  //TODO:  multiple?: boolean;
  /**
   * props of the textinput
   *
   * @type {NativeTextInputProps}
   */
  textInputProps?: NativeTextInputProps;
  /**
   * Style of the item in the dropdown list
   *
   * @type {StyleProp<ViewStyle>}
   */
  itemStyle?: StyleProp<ViewStyle>;
};
const DropDownList = ({
  data,
  label,
  containerStyle,
  searchable = false,
  textInputProps,
  maxHeight = 200,
  setSelected,
  selectedId,
  itemStyle = { paddingLeft: 20, height: 24 },
}: DropDownListProps) => {
  const intl = useIntl();
  const textInputRef = useRef<NativeTextInput>(null);
  const [focusedStyle, setFocusedStyle] = useState<StyleProp<TextStyle>>({});
  const [showDropDown, setShowDropDown] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DropDownListData | null>(
    null,
  );

  useEffect(() => {
    if (selectedId && selectedItem?.id !== selectedId) {
      const selectedItem = data.find(item => item.id === selectedId);
      if (selectedItem) {
        setSelectedItem(selectedItem);
      }
    }
  }, [data, selectedId, selectedItem?.id]);

  const selectItem = useCallback(
    (item: DropDownListData) => {
      setSelectedItem(item);
      setSelected(item);
      setShowDropDown(false);
    },
    [setSelected],
  );

  const [dropdownHeight, setDropdownHeight] = useState(maxHeight);

  useEffect(() => {
    //limit the height of scrollview to the max height or the height of the list
    const hh = Number(StyleSheet.flatten(itemStyle)?.height) ?? 24;
    setDropdownHeight(Math.min(maxHeight, data.length * hh));
  }, [data.length, itemStyle, maxHeight]);

  const toggleDropDownList = useCallback(() => {
    setShowDropDown(prev => !prev);
  }, []);

  const onInputFocus = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setFocusedStyle({
      borderColor: colors.grey900,
    });
    if (textInputProps?.onFocus) {
      textInputProps?.onFocus(e);
    }
  };

  const onInputBlur = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setFocusedStyle({});
    if (textInputProps?.onBlur) {
      textInputProps?.onBlur(e);
    }
  };

  const [inputHeight, setInputHeight] = useState(0);

  const onLayout = useCallback(({ nativeEvent }: LayoutChangeEvent) => {
    setInputHeight(nativeEvent.layout.height);
  }, []);

  return (
    <View style={[styles.container, containerStyle]} onLayout={onLayout}>
      {label && <Text style={styles.text}>{label}</Text>}
      <View
        pointerEvents={searchable ? 'box-none' : 'box-only'}
        onTouchStart={toggleDropDownList}
        testID="azzapp__dropdownlist__touchable-container"
      >
        <NativeTextInput
          selectionColor={colors.primary400}
          {...textInputProps}
          editable={searchable}
          ref={textInputRef}
          onFocus={onInputFocus}
          onBlur={onInputBlur}
          value={selectedItem?.label}
          style={[styles.input, focusedStyle, textInputProps?.style]}
          accessibilityState={{ disabled: !searchable }}
        />
        <PressableNative
          disabled={!searchable}
          style={styles.buttonDropDown}
          onPress={toggleDropDownList}
          accessibilityRole="button"
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Tap to show the list of options',
            description:
              'DropDownList - AccessibilityLabel button to show the drop down list',
          })}
        >
          <Icon
            icon="chevron-down-full"
            style={{
              width: 11,
              height: StyleSheet.flatten(textInputProps?.style)?.height ?? 43,
              marginLeft: 10,
              marginRight: 10,
            }}
          />
        </PressableNative>
      </View>
      {showDropDown && (
        <ViewTransition
          transitionDuration={300}
          transitions={['height']}
          testID="azzapp__dropdownlist__animated-view"
          style={[
            styles.dropdownStyles,
            {
              height: showDropDown ? dropdownHeight : 0,
              top: inputHeight + 10,
              zIndex: 100,
            },
          ]}
          pointerEvents="box-none"
        >
          <ScrollView
            contentContainerStyle={styles.scrollViewContainerStyle}
            style={{ zIndex: 200 }}
            nestedScrollEnabled={true}
            accessibilityRole="list"
          >
            {data.map(item => (
              <DropDownListItem
                key={`dropdownlist-item_${item.id}`}
                item={item}
                selectItem={selectItem}
                itemStyle={itemStyle}
              />
            ))}
          </ScrollView>
        </ViewTransition>
      )}
    </View>
  );
};
type DropDownListItemProps = {
  item: DropDownListData;
  selectItem: (item: DropDownListData) => void;
  itemStyle?: StyleProp<ViewStyle>;
};

const DropDownListItemComponent = ({
  item,
  selectItem,
  itemStyle,
}: DropDownListItemProps) => {
  const onPress = useCallback(() => {
    selectItem(item);
  }, [item, selectItem]);

  return (
    <PressableNative
      key={item.id}
      style={[
        {
          width: '100%',
          justifyContent: 'center',
          zIndex: 100,
        },
        itemStyle,
      ]}
      accessibilityRole="button"
      onPress={onPress}
    >
      <Text>{item.label}</Text>
    </PressableNative>
  );
};

const DropDownListItem = memo(
  DropDownListItemComponent,
  (prev, next) => prev.item.id === next.item.id,
);

export default DropDownList;
const width = Dimensions.get('window').width;
const styles = StyleSheet.create({
  scrollViewContainerStyle: {
    overflow: 'hidden',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  dropdownStyles: {
    borderWidth: 1,
    borderRadius: 10,
    borderColor: colors.grey50,
    position: 'absolute',
    width: '100%',
    overflow: 'hidden',
  },
  text: {
    ...fontFamilies.semiBold,
    paddingBottom: 5,
    size: 14,
  },
  container: {
    marginLeft: 10,
    marginRight: 10,
    width: width - 40,
    paddingBottom: 0, //will be replace by the error line specified on figma
    zIndex: 100, //zindex required to make the dropdownlist touchable work
  },
  input: {
    ...fontFamilies.normal,
    flexDirection: 'row',
    alignItems: 'center',
    height: 43,
    backgroundColor: colors.grey50,
    borderColor: colors.grey50,
    borderRadius: 12,
    paddingLeft: 20,
    paddingRight: 20,
    fontSize: 16,
    fontColor: colors.black,
    borderWidth: 1,
  },
  buttonDropDown: {
    position: 'absolute',
    justifyContent: 'center',
    right: 8,
  },
  errorTextStyle: {
    ...textStyles.error,
  },
});
