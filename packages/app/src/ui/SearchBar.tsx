import { useCallback, useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { TextInput, View, useColorScheme } from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { isNotFalsyString } from '@azzapp/shared/stringHelpers';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import useAnimatedState from '#hooks/useAnimatedState';
import Button from './Button';
import Container from './Container';
import Icon from './Icon';
import PressableNative from './PressableNative';
import type {
  StyleProp,
  ViewStyle,
  NativeSyntheticEvent,
  TextInputFocusEventData,
  GestureResponderEvent,
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
  autoFocus?: boolean;
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
  autoFocus,
}: SearchBarProps) => {
  const [searchValue, setSearchValue] = useState<string>();
  const textInputRef = useRef<TextInput>(null);

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
    onChangeText(undefined);
    if (onCancel) {
      onCancel();
    }
    textInputRef.current?.blur();
  };

  const onSubmitEditingLocal = () => {
    onSubmitEditing?.(searchValue);
  };

  const containerWidth = useSharedValue(0);
  const onLayout = useCallback(
    (e: LayoutChangeEvent) => {
      containerWidth.value = e.nativeEvent.layout.width;
    },
    [containerWidth],
  );

  //button width depends on the length of the text(i18n)
  const cancelButtonWidth = useSharedValue(0);
  const onButtonLayout = useCallback(
    (e: LayoutChangeEvent) => {
      cancelButtonWidth.value = e.nativeEvent.layout.width;
    },
    [cancelButtonWidth],
  );

  const focus = (event: GestureResponderEvent) => {
    event.preventDefault();
    textInputRef.current?.focus();
  };

  const styles = useStyleSheet(styleSheet);

  const [isFocused, setIsFocused] = useState(false);
  const timing = useAnimatedState(isFocused, { duration: animationDuration });

  const onInputFocus = useCallback(
    (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
      setIsFocused(true);
      onFocus?.(e);
    },
    [onFocus],
  );

  const onInputBlur = useCallback(
    (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
      setIsFocused(false);
      if (onBlur) {
        onBlur(e);
      }
    },
    [onBlur],
  );

  const intl = useIntl();
  const colorScheme = useColorScheme();
  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: interpolate(
        timing.value,
        [0, 1],
        [
          containerWidth.value,
          containerWidth.value - cancelButtonWidth.value - MARGIN_LEFT_BUTTON,
        ],
      ),
      borderWidth: timing.value,
      borderColor: interpolateColor(
        timing.value,
        [0, 1],
        [
          colorScheme === 'light' ? colors.grey50 : colors.grey1000,
          colorScheme === 'light' ? colors.grey900 : colors.grey400,
        ],
      ),
    };
  });

  return (
    <Container style={containerStyle}>
      <View
        testID="azzapp__SearchBar__container-view"
        style={styles.container}
        onLayout={onLayout}
      >
        <View style={styles.wrapper}>
          <Animated.View
            testID="azzapp__SearchBar__view-inputcontainer"
            style={[styles.innerSearchBarView, animatedStyle]}
            onTouchStart={focus}
          >
            <Icon
              icon="search"
              style={[styles.lensIcon, isFocused && styles.lensIconFocuses]}
            />
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
              style={styles.input}
              value={searchValue}
              onChangeText={onSetValueText}
              selectionColor={colors.primary400}
              returnKeyType="search"
              onSubmitEditing={onSubmitEditingLocal}
              autoFocus={autoFocus}
              placeholderTextColor={styles.placeHolder.color}
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
                <Icon icon="closeFull" style={styles.cancelIcon} />
              </PressableNative>
            )}
          </Animated.View>
          <Button
            accessibilityRole="button"
            accessibilityLabel={intl.formatMessage({
              defaultMessage: 'Tap to cancel your search',
              description: 'SearchBar accessibilityLabel Cancel Button',
            })}
            testID="azzapp__SearchBar__cancel-button"
            variant="secondary"
            onLayout={onButtonLayout}
            onPress={onPressCancel}
            label={intl.formatMessage({
              defaultMessage: 'Cancel',
              description: 'SearchBar - Cancel button',
            })}
          />
        </View>
      </View>
    </Container>
  );
};

export default SearchBar;
const MARGIN_LEFT_BUTTON = 10;

const styleSheet = createStyleSheet(appearance => ({
  innerSearchBarView: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: appearance === 'light' ? colors.grey50 : colors.grey1000,
    borderRadius: 12,
    fontSize: 16,
    color: appearance === 'light' ? colors.black : colors.grey400,
  },
  input: {
    flex: 1,
    height: 46,
    color: appearance === 'light' ? colors.black : colors.white,
  },
  placeHolder: {
    color: colors.grey400,
  },
  wrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    overflow: 'hidden',
    columnGap: 10,
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
    tintColor: colors.grey200,
  },
  lensIconFocuses: {
    tintColor: appearance === 'dark' ? colors.white : colors.black,
  },
  cancelPressable: {
    paddingRight: 10,
    marginLeft: 10,
  },
  cancelIcon: {
    padding: 1,
    tintColor: colors.grey200,
  },
}));
