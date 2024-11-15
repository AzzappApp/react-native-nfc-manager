import { useCallback, useRef } from 'react';
import { useIntl } from 'react-intl';
import { TextInput, View, useColorScheme } from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { isNotFalsyString } from '@azzapp/shared/stringHelpers';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
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
  onSubmitEditing?: () => void;
  placeholder?: string;
  animationDuration?: number; // not used right now - withTiming freezes on android
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
  autoFocus,
  animationDuration = 300,
}: SearchBarProps) => {
  const textInputRef = useRef<TextInput>(null);

  const onPressClear = useCallback(() => {
    onChangeText(undefined);
  }, [onChangeText]);

  const onPressCancel = useCallback(() => {
    onChangeText(undefined);
    if (onCancel) {
      onCancel();
    }
    textInputRef.current?.blur();
  }, [onCancel, onChangeText]);

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
      if (!cancelButtonWidth.value) {
        cancelButtonWidth.value = e.nativeEvent.layout.width;
      }
    },
    [cancelButtonWidth],
  );

  const focus = useCallback((event: GestureResponderEvent) => {
    event.preventDefault();
    textInputRef.current?.focus();
  }, []);

  const styles = useStyleSheet(styleSheet);

  const isFocused = useSharedValue(0);

  const onInputFocus = useCallback(
    (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
      onFocus?.(e);
      isFocused.value = withTiming(1, { duration: animationDuration }); // freezes on android
    },
    [animationDuration, isFocused, onFocus],
  );

  const onInputBlur = useCallback(
    (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
      onBlur?.(e);
      isFocused.value = withTiming(0, { duration: animationDuration }); // freezes on android
    },
    [animationDuration, isFocused, onBlur],
  );

  const intl = useIntl();
  const colorScheme = useColorScheme();

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: interpolate(
        isFocused.value,
        [0, 1],
        [
          containerWidth.value,
          containerWidth.value - cancelButtonWidth.value - MARGIN_LEFT_BUTTON,
        ],
      ),
      borderWidth: isFocused.value,
      borderColor: interpolateColor(
        isFocused.value,
        [0, 1],
        [
          colorScheme === 'light' ? colors.grey50 : colors.grey1000,
          colorScheme === 'light' ? colors.grey900 : colors.grey400,
        ],
      ),
    };
  });

  const wrapperStyle = useAnimatedStyle(() => {
    return {
      opacity: containerWidth.value ? 1 : 0,
    };
  });

  return (
    <Container style={containerStyle}>
      <View
        testID="azzapp__SearchBar__container-view"
        style={styles.container}
        onLayout={onLayout}
      >
        <Animated.View style={[styles.wrapper, wrapperStyle]}>
          <Animated.View
            testID="azzapp__SearchBar__view-inputcontainer"
            style={[styles.innerSearchBarView, animatedStyle]}
            onTouchStart={focus}
          >
            <Icon
              icon="search"
              style={
                isFocused
                  ? [styles.lensIcon, styles.lensIconFocuses]
                  : styles.lensIcon
              }
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
              defaultValue={value}
              onChangeText={onChangeText}
              selectionColor={colors.primary400}
              returnKeyType="search"
              onSubmitEditing={onSubmitEditing}
              autoFocus={autoFocus}
              placeholderTextColor={styles.placeHolder.color}
            />
            {isNotFalsyString(value) && (
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
        </Animated.View>
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
