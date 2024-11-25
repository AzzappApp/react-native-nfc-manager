import { useEffect, useState } from 'react';
import { Controller, useWatch } from 'react-hook-form';
import { FormattedMessage } from 'react-intl';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '#theme';
import {
  DELETE_BUTTON_WIDTH,
  buildContactCardModalStyleSheet,
} from '#helpers/contactCardHelpers';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import useBoolean from '#hooks/useBoolean';
import BottomSheetModal from '#ui/BottomSheetModal';
import Icon from '#ui/Icon';
import IconButton from '#ui/IconButton';
import PressableNative from '#ui/PressableNative';
import SelectList from '#ui/SelectList';
import Switch from '#ui/Switch';
import Text from '#ui/Text';
import { useFormDeleteContext } from './FormDeleteFieldOverlay';
import type { PropsWithChildren } from 'react';
import type { FieldValues, Control, FieldPath } from 'react-hook-form';
import type { LayoutRectangle } from 'react-native';

const ContactCardEditField = <TFieldValues extends FieldValues>({
  labelKey,
  deleteField,
  selectedKey,
  control,
  labelValues,
  onChangeLabel,
  children,
  errorMessage,
}: PropsWithChildren<{
  labelKey?: FieldPath<TFieldValues>;
  deleteField: () => void;
  selectedKey?: FieldPath<TFieldValues>;
  control: Control<TFieldValues>;
  labelValues?: Array<{ key: string; value: string }>;
  onChangeLabel?: (label: string) => void;
  errorMessage?: string;
}>) => {
  const deleteMode = useSharedValue(false);

  const {
    deleted,
    rect: deleteButtonRect,
    openDeleteButton,
  } = useFormDeleteContext();

  const style = useAnimatedStyle(() => ({
    paddingHorizontal: 0,
    flexDirection: 'column',
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

  const [visible, open, close] = useBoolean(false);

  const styles = useStyleSheet(stylesheet);

  return (
    <>
      <Animated.View
        style={[styles.field, style]}
        onLayout={event => setLayout(event.nativeEvent.layout)}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 20,
            flex: 1,
          }}
        >
          <View
            style={[
              styles.fieldContainer,
              { minWidth: labelValues && labelValues.length > 0 ? 100 : 0 },
            ]}
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
            {labelValues && labelValues.length > 0 && (
              <PressableNative style={styles.labelSelector} onPress={open}>
                <Text variant="smallbold">
                  {labelValues.find(
                    l => typeof label === 'string' && l.key === label,
                  )?.value ?? (typeof label === 'string' ? label : '')}
                </Text>
                <Icon icon="arrow_down" />
              </PressableNative>
            )}
          </View>
          {children}
          {selectedKey && (
            <Controller
              control={control}
              name={selectedKey}
              render={({ field: { onChange, value } }) => (
                <Switch
                  value={Boolean(value)}
                  onValueChange={onChange}
                  style={styles.switch}
                />
              )}
            />
          )}
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
        </View>
        {errorMessage && (
          <Text variant="error" style={{ paddingHorizontal: 20 }}>
            {errorMessage}
          </Text>
        )}
      </Animated.View>
      {labelKey && (
        <BottomSheetModal
          visible={visible}
          onDismiss={close}
          style={styles.bottomSheetStyle}
        >
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
                  close();
                }}
                selectedItemKey={value as string}
                labelField="value"
                useFlatList={false}
              />
            )}
          />
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
  bottomSheetStyle: { padding: 16 },
  switch: { marginRight: -8 },
  ...buildContactCardModalStyleSheet(appearance),
}));

export default ContactCardEditField;
