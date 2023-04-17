import { useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet, TextInput, View } from 'react-native';
import { isNotFalsyString } from '@azzapp/shared/stringHelpers';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Button from './Button';
import Container from './Container';
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

type SearchBarProps = {
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
}: SearchBarProps) => {
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
    textInputRef.current?.focus();
  };

  const appearanceStyle = useStyleSheet(computedStyle);
  const onInputFocus = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setFocusedStyle({
      width: containerWidth - cancelButtonWidth - MARGIN_LEFT_BUTTON,
      ...appearanceStyle.focused,
    });
    onFocus?.(e);
  };

  const onInputBlur = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setFocusedStyle({
      width: containerWidth,
      ...appearanceStyle.focused,
    });
    if (onBlur) {
      onBlur(e);
    }
  };

  const intl = useIntl();

  return (
    <Container style={containerStyle}>
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
                  appearanceStyle.innerSearchBarView,
                  { width: containerWidth },
                  focusedStyle,
                ]}
                transitionDuration={animationDuration}
                transitions={['width', 'borderColor']}
                onTouchStart={focus}
              >
                <Icon icon="search" style={styles.lensIcon} />
                <TextInput
                  testID="azzapp__searchbar__textInput"
                  accessibilityLabel={intl.formatMessage({
                    defaultMessage: 'Enter your search word',
                    description: 'Seach bar - accessibility label',
                  })}
                  placeholder={placeholder}
                  ref={textInputRef}
                  onFocus={onInputFocus}
                  onBlur={onInputBlur}
                  style={[styles.input, appearanceStyle.input]}
                  value={searchValue}
                  onChangeText={onSetValueText}
                  selectionColor={colors.primary400}
                  returnKeyType="search"
                  onSubmitEditing={onSubmitEditingLocal}
                />
                {isNotFalsyString(searchValue) && (
                  <PressableNative
                    accessibilityRole="button"
                    accessibilityLabel={intl.formatMessage({
                      defaultMessage: 'Tap to clear your search',
                      description: 'SearchBar accessibilityLabel Clear Button',
                    })}
                    onPress={onPressClear}
                    testID="azzapp__SearchBar__clear-button"
                    style={styles.cancelPressable}
                  >
                    <Icon icon="search" style={styles.lensIcon} />
                  </PressableNative>
                )}
              </ViewTransition>
              <Button
                accessibilityRole="button"
                accessibilityLabel={intl.formatMessage({
                  defaultMessage: 'Tap to cancel your search',
                  description: 'SearchBar accessibilityLabel Cancel Button',
                })}
                testID="azzapp__SearchBar__cancel-button"
                style={[styles.cancelButton]}
                onLayout={onButtonLayout}
                onPress={onPressCancel}
                label={intl.formatMessage({
                  defaultMessage: 'Cancel',
                  description: 'SearchBar - Cancel button',
                })}
              />
            </>
          )}
        </View>
      </View>
    </Container>
  );
};

export default SearchBar;
const MARGIN_LEFT_BUTTON = 10;
const computedStyle = createStyleSheet(appearance => ({
  innerSearchBarView: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: appearance === 'light' ? colors.grey50 : colors.grey1000,
    borderColor: appearance === 'light' ? colors.grey50 : colors.grey1000,
    borderRadius: 12,
    fontSize: 16,
    color: appearance === 'light' ? colors.black : colors.grey400,
    borderWidth: 1,
  },
  focused: {
    borderColor: appearance === 'light' ? colors.grey900 : colors.grey400,
  },
  input: {
    color: appearance === 'light' ? colors.black : colors.white, //TODO: darkmode input color is not defined waiting for design team
  },
}));
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

  clearIcon: {
    width: 15,
    height: 15,
    marginLeft: 16,
    marginRight: 11,
  },
  lensIcon: {
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
