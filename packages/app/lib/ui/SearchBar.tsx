import { isNotFalsyString } from '@azzapp/shared/lib/stringHelpers';
import { useEffect, useRef, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { StyleSheet, TextInput, View, Text } from 'react-native';
import { fontFamilies, colors } from '../../theme';

import Icon from './Icon';
import PressableNative from './PressableNative';
import ViewTransition from './ViewTransition';
import type {
  StyleProp,
  ViewStyle,
  NativeSyntheticEvent,
  TextInputFocusEventData,
  GestureResponderEvent,
  TextStyle,
  LayoutChangeEvent,
} from 'react-native';

type Props = {
  containerStyle?: StyleProp<ViewStyle>;
  onCancel?: () => void;
  onChangeText: (text?: string) => void;
  onFocus?: (e: NativeSyntheticEvent<TextInputFocusEventData>) => void;
  onBlur?: (e: NativeSyntheticEvent<TextInputFocusEventData>) => void;
  onSubmitEditing?: (search: string | undefined) => void;
  placeholder?: string;
  animationDuration?: number;
  value?: string;
};

const SearchBar = ({
  containerStyle,
  onFocus,
  onBlur,
  onCancel,
  onChangeText,
  onSubmitEditing,
  placeholder,
  value,
  animationDuration = 300,
}: Props) => {
  const [searchValue, setSearchValue] = useState<string>();
  const textInputRef = useRef<TextInput>(null);
  const [focusedStyle, setFocusedStyle] = useState<StyleProp<TextStyle>>({});

  useEffect(() => {
    setSearchValue(value);
  }, [value]);

  const onSetValueText = (text: string) => {
    setSearchValue(text);
    onChangeText(text);
  };

  const onPressClear = () => {
    setSearchValue(undefined);
    onChangeText(undefined);
  };

  const onPressCancel = () => {
    setSearchValue(undefined);
    if (onCancel) {
      onCancel();
    }
    textInputRef.current?.blur();
  };

  const onSubmitEditingLocal = () => {
    onSubmitEditing?.(searchValue);
  };

  const [containerWidth, setContainerWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) =>
    setContainerWidth(e.nativeEvent.layout.width);

  //button width depends on the length of the text(i18n)
  const [cancelButtonWidth, setCancelButtonWidth] = useState<number>(0);
  const onButtonLayout = (e: LayoutChangeEvent) =>
    setCancelButtonWidth(e.nativeEvent.layout.width);

  const focus = (event: GestureResponderEvent) => {
    event.preventDefault();
    console.log('callin focus');
    textInputRef.current?.focus();
  };

  const onInputFocus = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setFocusedStyle({
      width: containerWidth - cancelButtonWidth - MARGIN_LEFT_BUTTON,
      borderColor: colors.grey900,
    });
    onFocus?.(e);
  };

  const onInputBlur = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setFocusedStyle({ width: containerWidth, borderColor: colors.grey50 });
    if (onBlur) {
      onBlur(e);
    }
  };

  return (
    <View style={containerStyle}>
      <View
        testID="azzapp__SearchBar__container-view"
        style={styles.container}
        onLayout={onLayout}
      >
        <View style={styles.wrapper}>
          {containerWidth > 0 && (
            <>
              <ViewTransition
                testID="azzapp__SearchBar__view-inputcontainer"
                style={[
                  styles.innerSearchBarView,
                  { width: containerWidth },
                  focusedStyle,
                ]}
                transitionDuration={animationDuration}
                transitions={['width', 'borderColor']}
                onTouchStart={focus}
              >
                <Icon icon="lens" style={styles.lensIcon} />
                <TextInput
                  testID="azzapp__searchbar__textInput"
                  placeholder={placeholder}
                  ref={textInputRef}
                  onFocus={onInputFocus}
                  onBlur={onInputBlur}
                  style={[styles.input]}
                  value={searchValue}
                  onChangeText={onSetValueText}
                  selectionColor={colors.red}
                  returnKeyType="search"
                  onSubmitEditing={onSubmitEditingLocal}
                />
                {isNotFalsyString(searchValue) && (
                  <PressableNative
                    onPress={onPressClear}
                    testID="azzapp__SearchBar__clear-button"
                    style={styles.cancelPressable}
                  >
                    <Icon icon="cancel" style={styles.lensIcon} />
                  </PressableNative>
                )}
              </ViewTransition>

              <PressableNative
                testID="azzapp__SearchBar__cancel-button"
                style={[styles.cancelButton]}
                onLayout={onButtonLayout}
                onPress={onPressCancel}
              >
                <Text numberOfLines={1}>
                  <FormattedMessage
                    defaultMessage="Cancel"
                    description="SearchBar - Cancel button"
                  />
                </Text>
              </PressableNative>
            </>
          )}
        </View>
      </View>
    </View>
  );
};

export default SearchBar;
const MARGIN_LEFT_BUTTON = 10;
const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },
  container: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexDirection: 'row',
    width: '100%', //important for animation,to be based on the maxWith of the parent
  },
  innerSearchBarView: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.grey50,
    borderColor: colors.grey50,
    borderRadius: 12,
    fontSize: 16,
    fontColor: colors.black,
    borderWidth: 1,
  },
  clearIcon: {
    width: 15,
    height: 15,
    marginLeft: 16,
    marginRight: 11,
  },
  lensIcon: {
    width: 20,
    height: 20,
    marginLeft: 16,
    marginRight: 11,
  },
  cancelPressable: {
    paddingRight: 10,
    marginLeft: 10,
  },
  cancelIcon: {
    width: 15,
    height: 15,
    padding: 1,
  },
  input: {
    ...fontFamilies.normal,
    flex: 1,
    height: 46,
  },
  cancelButton: {
    height: 46,
    marginLeft: MARGIN_LEFT_BUTTON,
    paddingLeft: 15,
    paddingRight: 15,
    borderWidth: 1,
    borderColor: colors.black,
    borderRadius: 12,
    backgroundColor: colors.grey50,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
