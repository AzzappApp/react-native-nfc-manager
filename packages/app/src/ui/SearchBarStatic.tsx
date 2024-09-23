import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, TextInput } from 'react-native';
import { colors } from '#theme';
import Icon from './Icon';
import IconButton from './IconButton';
import type {
  GestureResponderEvent,
  NativeSyntheticEvent,
  TextInputFocusEventData,
  TextInputProps,
} from 'react-native';

type SearchBarStaticProps = TextInputProps & {
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
        selectionColor={colors.primary400}
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

const styles = StyleSheet.create({
  innerSearchBarView: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.grey50,
    borderRadius: 12,
    fontSize: 16,
    color: colors.black,
    position: 'relative',
  },

  lensIcon: {
    marginLeft: 16,
    marginRight: 11,
    tintColor: colors.grey200,
  },
  lensIconFocuses: {
    tintColor: colors.black,
  },
  input: {
    flex: 1,
    height: 46,
    color: colors.black,
  },
  placeHolder: {
    color: colors.grey400,
  },
  close: {
    position: 'absolute',
    right: 15,
  },
  closeIcon: {
    tintColor: colors.grey200,
  },
});

export default SearchBarStatic;
