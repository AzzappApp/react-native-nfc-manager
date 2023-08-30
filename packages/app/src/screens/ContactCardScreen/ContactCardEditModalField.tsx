import { useEffect, useState } from 'react';
import {
  Controller,
  type Control,
  type FieldPath,
  useWatch,
} from 'react-hook-form';
import { FormattedMessage } from 'react-intl';
import { View, TextInput, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '#theme';
import BottomSheetModal from '#ui/BottomSheetModal';
import Icon from '#ui/Icon';
import IconButton from '#ui/IconButton';
import PressableNative from '#ui/PressableNative';
import SelectList from '#ui/SelectList';
import Switch from '#ui/Switch';
import Text from '#ui/Text';
import contactModalStyles, {
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
}: {
  deleted: boolean;
  deleteButtonRect: LayoutRectangle | null;
  labelKey: FieldPath<ContactCardEditForm>;
  keyboardType: TextInputProps['keyboardType'];
  deleteField: () => void;
  openDeleteButton: (changeEvent: LayoutRectangle) => void;
  closeDeleteButton: () => void;
  valueKey: FieldPath<ContactCardEditForm>;
  selectedKey: FieldPath<ContactCardEditForm>;
  control: Control<ContactCardEditForm>;
  labelValues: Array<{ key: string; value: string }>;
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

  const label = useWatch({
    control,
    name: labelKey,
  });

  const [visible, setVisible] = useState(false);

  return (
    <>
      <Animated.View
        style={[styles.field, style, { backgroundColor: colors.white }]}
        onLayout={event => setLayout(event.nativeEvent.layout)}
        // TODO reenable once RANIMATED3 see: https://github.com/software-mansion/react-native-reanimated/issues/3124

        // entering={FadeInDown}
        // exiting={FadeOutUp.withInitialValues({
        //   originX: -50,
        // }).withCallback(callback)}
      >
        <View
          style={{
            columnGap: 7,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
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
            />
          )}
        />
        <Controller
          control={control}
          name={selectedKey}
          render={({ field: { onChange, value } }) => (
            <Switch value={value as boolean} onValueChange={onChange} />
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

      <BottomSheetModal
        visible={visible}
        onRequestClose={() => setVisible(false)}
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
                  setVisible(false);
                }}
                selectedItemKey={value as string}
                labelField="value"
              />
            )}
          />
        </View>
      </BottomSheetModal>
    </>
  );
};

const styles = StyleSheet.create({
  deleteButton: {
    right: -70,
    height: 32,
    width: DELETE_BUTTON_WIDTH,
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.red400,
  },
  labelSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
  },
  ...contactModalStyles,
});

export default ContactCardEditModalField;
