import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, TextInput as NativeTextInput } from 'react-native';

import { useDebouncedCallback } from 'use-debounce';
import { colors, textStyles } from '#theme';
import Input from '#ui/Input';
import type { SocialLinkItemType } from '@azzapp/shared/socialLinkHelpers';
import type {
  NativeSyntheticEvent,
  TextInputEndEditingEventData,
  ViewStyle,
} from 'react-native';

const httpsPrefix = 'https://';
const httpPrefix = 'http://';

type SocialLinkInputProps = {
  // type of social. allow to display the correct prefix
  linkType: SocialLinkItemType;
  // notify input value change
  onChangeLink: (value: string) => void;
  // default value to display in the text field
  defaultValue: string;
  // allow to display to red border in case of error
  isErrored?: boolean;
  // style of container
  style?: ViewStyle;
};

/*
 * input text for social link configuration
 * defaultValue is a full url -> the removal of prefix (http + mask) will be done in this component
 * onChangeLink with report the new value without the prefix
 */
const SocialLinkInput = ({
  linkType,
  onChangeLink,
  defaultValue,
  isErrored,
  style,
}: SocialLinkInputProps) => {
  const cleanUpLinkUrl = useCallback(
    (value: string) => {
      value = value.trim();
      //handle copy paste from the user with complete link
      let filterText = value;
      if (filterText.startsWith(httpsPrefix)) {
        filterText = filterText.slice(httpsPrefix.length, filterText.length);
      }
      if (filterText.startsWith(httpPrefix)) {
        filterText = filterText.slice(httpPrefix.length, filterText.length);
      }

      if (
        linkType.mask &&
        linkType.mask.length &&
        filterText.includes(linkType.mask)
      ) {
        const index = value.indexOf(linkType.mask);
        filterText = value.substring(index + linkType.mask.length);
        const endIndex = filterText.indexOf('?');
        if (endIndex !== -1) {
          filterText = filterText.substring(0, endIndex);
        }
      }
      return filterText;
    },
    [linkType.mask],
  );

  const [localValue, setLocalValue] = useState(cleanUpLinkUrl(defaultValue));

  useEffect(() => {
    // To ensure parent component
    onChangeLink(localValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const debouncedChangeLink = useDebouncedCallback(onChangeLink, 500, {
    leading: true,
  });

  const onChangeText = useCallback(
    (value: string) => {
      const filteredText = cleanUpLinkUrl(value);
      setLocalValue(filteredText);
      debouncedChangeLink(filteredText);
    },
    [cleanUpLinkUrl, debouncedChangeLink],
  );

  const onEndEditing = useCallback(
    async (e: NativeSyntheticEvent<TextInputEndEditingEventData>) => {
      const filteredText = cleanUpLinkUrl(e.nativeEvent.text);
      setLocalValue(filteredText);
      onChangeLink(filteredText);
    },
    [cleanUpLinkUrl, onChangeLink],
  );

  const leftElement = useMemo(
    () => (
      <NativeTextInput
        selectionColor={colors.primary400}
        textAlignVertical="center"
        value={linkType.mask}
        editable={false}
        style={styles.prefixStyle}
      />
    ),
    [linkType.mask],
  );

  const containerStyle = style
    ? [styles.inputContainer, style]
    : styles.inputContainer;

  return (
    <View style={containerStyle}>
      <Input
        style={styles.input}
        clearButtonMode="always"
        value={localValue}
        leftElement={leftElement}
        onChangeText={onChangeText}
        onEndEditing={onEndEditing}
        autoCapitalize="none"
        autoCorrect={false}
        isErrored={isErrored}
        inputStyle={styles.inputStyleSocial}
        keyboardType={
          ['phone', 'sms'].includes(linkType.id) ? 'phone-pad' : 'default'
        }
        numberOfLines={1}
        autoFocus
      />
    </View>
  );
};

const styles = StyleSheet.create({
  inputStyleSocial: {
    paddingLeft: 0,
    // workaround to make numberOfLines working fine
    borderColor: 'transparent',
    borderWidth: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    flex: 1,
  },
  input: { flex: 1, paddingHorizontal: 5 },
  prefixStyle: {
    ...textStyles.textField,
    justifyContent: 'center',
    textAlignVertical: 'center',
    flex: 1,
    flexGrow: 1,
    lineHeight: 22,
    color: colors.grey400,
  },
});

export default memo(SocialLinkInput);
