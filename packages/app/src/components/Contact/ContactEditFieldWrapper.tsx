import { useCallback, useEffect, useMemo, useState } from 'react';
import { Controller, useWatch } from 'react-hook-form';
import { FormattedMessage } from 'react-intl';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useDebouncedCallback } from 'use-debounce';
import { colors } from '#theme';
import {
  DELETE_BUTTON_WIDTH,
  buildContactStyleSheet,
} from '#helpers/contactHelpers';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import useBoolean from '#hooks/useBoolean';
import useScreenDimensions from '#hooks/useScreenDimensions';
import useScreenInsets from '#hooks/useScreenInsets';
import BottomSheetModal from '#ui/BottomSheetModal';
import Icon from '#ui/Icon';
import IconButton from '#ui/IconButton';
import PressableNative from '#ui/PressableNative';
import SelectList from '#ui/SelectList';
import Text from '#ui/Text';
import { useFormDeleteContext } from '../FormDeleteFieldOverlay';
import type { PropsWithChildren } from 'react';
import type { FieldValues, Control, FieldPath } from 'react-hook-form';
import type { LayoutRectangle } from 'react-native';

const ContactEditFieldWrapper = <TFieldValues extends FieldValues>({
  labelKey,
  deleteField,
  control,
  labelValues,
  onChangeLabel,
  children,
  errorMessage,
}: PropsWithChildren<{
  labelKey?: FieldPath<TFieldValues>;
  deleteField: () => void;
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

  const watchable = labelKey
    ? {
        control,
        name: labelKey,
      }
    : { control };

  const label = useWatch(watchable);

  const [visible, open, close] = useBoolean(false);

  const styles = useStyleSheet(stylesheet);

  const { height: screenHeight } = useScreenDimensions();
  const insets = useScreenInsets();
  const maxHeight = (screenHeight * 2) / 3;

  // estimate size of the bottomSheet
  const expectedHeight =
    (labelValues?.length || 0) * 30 +
    10 + // size of the header
    2 * styles.bottomSheetStyle.padding +
    insets.bottom; // max height is 2/3 of screen size

  const useFlatList = expectedHeight > maxHeight;

  const onPressDelete = useCallback(() => {
    deleteMode.set(!deleteMode.value);
    if (layout) {
      openDeleteButton(layout);
    }
  }, [deleteMode, layout, openDeleteButton]);

  const snapPoints = useMemo(
    () => [useFlatList ? '66%' : expectedHeight],
    [useFlatList, expectedHeight],
  );

  const onItemSelected = useDebouncedCallback(
    (item: { key: string }, onChange: (value: string) => void) => {
      close();
      onChangeLabel?.(item.key);
      onChange(item.key);
    },
    250,
  );

  return (
    <>
      <Animated.View
        style={[styles.field, style]}
        onLayout={event => setLayout(event.nativeEvent.layout)}
      >
        <View style={styles.container}>
          <View
            style={[
              styles.fieldContainer,
              { minWidth: labelValues && labelValues.length > 0 ? 130 : 0 },
            ]}
          >
            <IconButton
              variant="icon"
              icon="delete_filled"
              iconStyle={styles.icon}
              onPress={onPressDelete}
            />
            {labelValues && labelValues.length > 0 && (
              <PressableNative
                style={styles.labelSelector}
                android_ripple={{
                  foreground: true,
                  borderless: true,
                }}
                onPress={open}
              >
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
          <PressableNative
            style={styles.deleteButton}
            pointerEvents="auto"
            onPress={deleteField}
          >
            <Text variant="button" style={styles.deleteButtonText}>
              <FormattedMessage
                defaultMessage="Delete"
                description="Delete email or phone number"
              />
            </Text>
          </PressableNative>
        </View>
        {errorMessage && (
          <Text variant="error" style={styles.errorText}>
            {errorMessage}
          </Text>
        )}
      </Animated.View>
      {labelKey && visible && (
        <BottomSheetModal
          visible={visible}
          onDismiss={close}
          style={styles.bottomSheetStyle}
          snapPoints={snapPoints}
          dismissKeyboardOnOpening
          enableDynamicSizing={false}
        >
          <Controller
            name={labelKey}
            control={control}
            render={({ field: { onChange, value } }) => (
              <SelectList
                keyExtractor={item => item.key}
                data={labelValues}
                onItemSelected={item => onItemSelected(item, onChange)}
                selectedItemKey={value as string}
                labelField="value"
                useFlatList={useFlatList}
              />
            )}
          />
        </BottomSheetModal>
      )}
    </>
  );
};

const stylesheet = createStyleSheet(appearance => ({
  icon: { tintColor: colors.red400 },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    flex: 1,
  },
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
  deleteButtonText: { color: colors.white },
  labelSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 5,
  },
  errorText: { paddingHorizontal: 20 },
  bottomSheetStyle: { padding: 16 },
  switch: { marginRight: -8 },
  ...buildContactStyleSheet(appearance),
}));

export default ContactEditFieldWrapper;
