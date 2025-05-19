import { useEffect, useRef, useState } from 'react';
import { View, TextInput, useColorScheme } from 'react-native';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Icon from './Icon';
import IconButton from './IconButton';
import type {
  GestureResponderEvent,
  NativeSyntheticEvent,
  StyleProp,
  TextInputFocusEventData,
  TextInputProps,
  ViewStyle,
} from 'react-native';

type SearchBarStaticProps = TextInputProps & {
  style?: StyleProp<ViewStyle>;
  onChangeText: (text: string | undefined) => void;
  onSubmitEditing?: (text: string | undefined) => void;
};

const SearchBarStatic = (props: SearchBarStaticProps) => {
  const {
    placeholder,
    onBlur,
    onFocus,
    autoFocus,
    onChangeText,
    onSubmitEditing,
    value,
    style,
    ...others
  } = props;

  const [isFocused, setIsFocused] = useState(false);

  const [searchValue, setSearchValue] = useState<string>();
  const textInputRef = useRef<TextInput>(null);

  useEffect(() => {
    setSearchValue(value);
  }, [value]);

  const onInputFocus = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const onInputBlur = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const onSetValueText = (text: string) => {
    setSearchValue(text);
    onChangeText(text);
  };

  const onSubmitEditingLocal = () => {
    onSubmitEditing?.(searchValue);
  };

  const onInnerFocus = (event: GestureResponderEvent) => {
    event.preventDefault();
    textInputRef.current?.focus();
  };

  const onClose = () => {
    setSearchValue(undefined);
    onChangeText(undefined);
    textInputRef.current?.blur();
  };

  const styles = useStyleSheet(styleSheet);

  const appearance = useColorScheme();

  return (
    <View
      style={[style, styles.innerSearchBarView]}
      onTouchStart={onInnerFocus}
    >
      <Icon
        icon="search"
        style={[styles.lensIcon, isFocused && styles.lensIconFocuses]}
      />
      <TextInput
        {...others}
        accessibilityLabel={placeholder}
        placeholder={placeholder}
        ref={textInputRef}
        onFocus={onInputFocus}
        onBlur={onInputBlur}
        style={styles.input}
        value={searchValue}
        onChangeText={onSetValueText}
        selectionColor={appearance === 'dark' ? colors.white : colors.black}
        returnKeyType="search"
        onSubmitEditing={onSubmitEditingLocal}
        autoFocus={autoFocus}
        placeholderTextColor={styles.placeHolder.color}
      />
      {searchValue && (
        <IconButton
          icon="closeFull"
          style={styles.close}
          onPress={onClose}
          iconStyle={styles.closeIcon}
          variant="icon"
        />
      )}
    </View>
  );
};

const styleSheet = createStyleSheet(appearance => ({
  innerSearchBarView: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: appearance === 'dark' ? colors.grey1000 : colors.grey50,
    borderRadius: 12,
    fontSize: 16,
    color: appearance === 'dark' ? colors.white : colors.black,
    position: 'relative',
  },
  lensIcon: {
    marginLeft: 16,
    marginRight: 11,
    tintColor: appearance === 'dark' ? colors.grey800 : colors.grey200,
  },
  lensIconFocuses: {
    tintColor: appearance === 'dark' ? colors.white : colors.black,
  },
  input: {
    flex: 1,
    height: 46,
    color: appearance === 'dark' ? colors.white : colors.black,
  },
  placeHolder: {
    color: colors.grey400,
  },
  close: {
    position: 'absolute',
    right: 15,
  },
  closeIcon: {
    tintColor: appearance === 'dark' ? colors.grey800 : colors.grey200,
  },
}));

export default SearchBarStatic;
