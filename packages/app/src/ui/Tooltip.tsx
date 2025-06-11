import { StyleSheet, useColorScheme } from 'react-native';
import Popover, { PopoverMode } from 'react-native-popover-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, shadow } from '#theme';
import PressableNative from './PressableNative';
import Text from './Text';
import type { ReactNode } from 'react';
import type { PublicPopoverProps } from 'react-native-popover-view/dist/Popover';
import type { PopoverProps } from 'react-native-popover-view/dist/Types';

const Tooltip = ({
  tooltipWidth = 240,
  header,
  description,
  children,
  onPress,
  ...props
}: PopoverProps &
  PublicPopoverProps & {
    tooltipWidth?: number;
    header?: ReactNode;
    description?: ReactNode;
    onPress?: () => void;
  }) => {
  const scheme = useColorScheme();
  const insets = useSafeAreaInsets();

  return (
    <Popover
      mode={PopoverMode.JS_MODAL}
      arrowSize={{
        height: 13,
        width: 28,
      }}
      backgroundStyle={styles.backgroundStyle}
      popoverStyle={{
        borderRadius: 10,
        backgroundColor: colors.white,
        padding: 10,
        width: tooltipWidth,
        ...shadow({
          appearance: scheme || 'dark',
          direction: 'bottom',
          forceOldShadow: true,
        }),
      }}
      displayAreaInsets={insets}
      {...props}
    >
      {children || (
        <PressableNative
          activeOpacity={onPress ? 0.2 : 1}
          style={styles.contentContainer}
          accessibilityRole="button"
          onPress={onPress}
        >
          {header && (
            <Text
              variant="large"
              style={styles.contentHeader}
              appearance="light"
            >
              {header}
            </Text>
          )}
          {description && (
            <Text
              variant="medium"
              style={styles.contentDescription}
              appearance="light"
            >
              {description}
            </Text>
          )}
        </PressableNative>
      )}
    </Popover>
  );
};

export default Tooltip;

const styles = StyleSheet.create({
  contentContainer: { padding: 10, gap: 5, pointerEvents: 'box-none' },
  contentHeader: {
    textAlign: 'center',
  },
  contentDescription: { textAlign: 'center' },
  backgroundStyle: { backgroundColor: colors.transparent },
});
