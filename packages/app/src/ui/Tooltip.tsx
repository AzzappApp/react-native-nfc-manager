import { StyleSheet, useColorScheme } from 'react-native';
import Popover, { PopoverMode } from 'react-native-popover-view';
import { colors, shadow } from '#theme';
import PressableNative from './PressableNative';
import Text from './Text';
import type { ReactNode } from 'react';
import type { PublicPopoverProps } from 'react-native-popover-view/dist/Popover';
import type { PopoverProps } from 'react-native-popover-view/dist/Types';

const Tooltip = ({
  toolipWidth = 240,
  header,
  description,
  children,
  onPress,
  ...props
}: PopoverProps &
  PublicPopoverProps & {
    toolipWidth?: number;
    header?: ReactNode;
    description?: ReactNode;
    onPress?: () => void;
  }) => {
  const scheme = useColorScheme();
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
        width: toolipWidth,
        ...shadow(scheme || 'dark', 'bottom'),
      }}
      {...props}
    >
      <PressableNative
        activeOpacity={onPress ? 0.2 : 1}
        style={styles.contentContainer}
        accessibilityRole="button"
        onPress={onPress}
      >
        {header && (
          <Text
            variant="button"
            style={styles.contentHeader}
            appearance="light"
          >
            {header}
          </Text>
        )}
        {description && (
          <Text
            variant="button"
            style={styles.contentDescription}
            appearance="light"
          >
            {description}
          </Text>
        )}
      </PressableNative>
    </Popover>
  );
};

export default Tooltip;

const styles = StyleSheet.create({
  contentContainer: { padding: 10 },
  contentHeader: {
    textAlign: 'center',
    color: colors.black,
  },
  contentDescription: { textAlign: 'center', color: colors.grey400 },
  backgroundStyle: { backgroundColor: 'transparent' },
});
