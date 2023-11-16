import { useEffect, useState } from 'react';
import {
  Controller,
  type Control,
  type FieldPath,
  useWatch,
} from 'react-hook-form';
import { FormattedMessage } from 'react-intl';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import BottomSheetModal from '#ui/BottomSheetModal';
import Icon from '#ui/Icon';
import IconButton from '#ui/IconButton';
import PressableNative from '#ui/PressableNative';
import SelectList from '#ui/SelectList';
import Switch from '#ui/Switch';
import Text from '#ui/Text';
import TextInput from '#ui/TextInput';
import {
  buildContactCardModalStyleSheet,
  DELETE_BUTTON_WIDTH,
} from './ContactCardEditModalStyles';
import type { ContactCardEditForm } from './ContactCardEditModalSchema';
import type { LayoutRectangle, TextInputProps } from 'react-native';

const ContactCardEditModalField = ({
  labelKey,
  deleteField,
  keyboardType,
  openDeleteButton,
  deleted,
  deleteButtonRect,
  closeDeleteButton: _,
  valueKey,
  selectedKey,
  control,
  labelValues,
  placeholder,
  onChangeLabel,
}: {
  deleted: boolean;
  deleteButtonRect: LayoutRectangle | null;
  labelKey?: FieldPath<ContactCardEditForm>;
  keyboardType: TextInputProps['keyboardType'];
  deleteField: () => void;
  openDeleteButton: (changeEvent: LayoutRectangle) => void;
  closeDeleteButton: () => void;
  valueKey: FieldPath<ContactCardEditForm>;
  selectedKey: FieldPath<ContactCardEditForm>;
  control: Control<ContactCardEditForm>;
  labelValues?: Array<{ key: string; value: string }>;
  placeholder?: string;
  onChangeLabel?: (label: string) => void;
}) => {
  const deleteMode = useSharedValue(false);

  const style = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: withTiming(deleteMode.value ? -DELETE_BUTTON_WIDTH : 0, {
          duration: 200,
          easing: Easing.inOut(Easing.ease),
        }),
      },
    ],
  }));

  const [layout, setLayout] = useState<LayoutRectangle | null>(null);

  useEffect(() => {
    if (deleteMode.value) {
      if (deleted) {
        deleteField();
      } else if (deleteButtonRect === null) {
        deleteMode.value = false;
      }
    }
  }, [deleteButtonRect, deleteField, deleteMode, deleted]);

  // const callback = useCallback(() => {
  //   'worklet';
  //   runOnJS(closeDeleteButton)();
  // }, [closeDeleteButton]);

  const watchable = labelKey
    ? {
        control,
        name: labelKey,
      }
    : { control };

  const label = useWatch(watchable);

  const [visible, setVisible] = useState(false);

  const styles = useStyleSheet(stylesheet);

  return (
    <>
      <Animated.View
        style={[styles.field, style]}
        onLayout={event => setLayout(event.nativeEvent.layout)}
        // TODO reenable once RANIMATED3 see: https://github.com/software-mansion/react-native-reanimated/issues/3124

        // entering={FadeInDown}
        // exiting={FadeOutUp.withInitialValues({
        //   originX: -50,
        // }).withCallback(callback)}
      >
        <View style={styles.fieldContainer}>
          <IconButton
            variant="icon"
            icon="delete_filled"
            iconStyle={{ tintColor: colors.red400 }}
            onPress={() => {
              deleteMode.value = !deleteMode.value;
              if (layout) {
                openDeleteButton(layout);
              }
            }}
          />
          {labelValues && labelValues.length > 0 && (
            <PressableNative
              style={styles.labelSelector}
              onPress={() => setVisible(true)}
            >
              <Text variant="smallbold">
                {labelValues.find(l => l.key === label)?.value ??
                  (label as string)}
              </Text>
              <Icon icon="arrow_down" />
            </PressableNative>
          )}
        </View>
        <Controller
          control={control}
          name={valueKey}
          render={({ field: { onChange, value } }) => (
            <TextInput
              value={value as string}
              onChangeText={onChange}
              style={styles.input}
              numberOfLines={1}
              keyboardType={keyboardType}
              clearButtonMode="while-editing"
              testID="contact-card-edit-modal-field"
              placeholder={placeholder}
            />
          )}
        />
        <Controller
          control={control}
          name={selectedKey}
          render={({ field: { onChange, value } }) => (
            <Switch
              value={value as boolean}
              onValueChange={onChange}
              style={styles.switch}
            />
          )}
        />
        <PressableNative
          style={styles.deleteButton}
          pointerEvents="auto"
          onPress={deleteField}
        >
          <Text variant="button" style={{ color: colors.white }}>
            <FormattedMessage
              defaultMessage="Delete"
              description="Delete email or phone number"
            />
          </Text>
        </PressableNative>
      </Animated.View>

      {labelKey && (
        <BottomSheetModal
          visible={visible}
          onRequestClose={() => setVisible(false)}
          nestedScroll
        >
          <View>
            <Controller
              name={labelKey}
              control={control}
              render={({ field: { onChange, value } }) => (
                <SelectList
                  keyExtractor={item => item.key}
                  data={labelValues}
                  onItemSelected={item => {
                    onChange(item.key);
                    onChangeLabel?.(item.key);
                    setVisible(false);
                  }}
                  selectedItemKey={value as string}
                  labelField="value"
                />
              )}
            />
          </View>
        </BottomSheetModal>
      )}
    </>
  );
};

const stylesheet = createStyleSheet(appearance => ({
  fieldContainer: {
    columnGap: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    right: -DELETE_BUTTON_WIDTH,
    height: '100%',
    width: DELETE_BUTTON_WIDTH,
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.red400,
  },
  labelSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 5,
  },
  switch: { marginRight: -8 },
  ...buildContactCardModalStyleSheet(appearance),
}));

export default ContactCardEditModalField;
