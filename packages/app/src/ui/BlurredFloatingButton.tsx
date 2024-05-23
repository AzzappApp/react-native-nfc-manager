import { BlurView } from 'expo-blur';
import { forwardRef } from 'react';
import { colors } from '#theme';
import {
  createVariantsStyleSheet,
  useVariantStyleSheet,
} from '#helpers/createStyles';
import Icon from '#ui/Icon';
import PressableOpacity from './PressableOpacity';
import type { FloatingButtonProps } from './FloatingButton';
import type { FloatingIconButtonProps } from './FloatingIconButton';
import type { ForwardedRef } from 'react';
import type { View } from 'react-native';

export type BlurredFloatingButtonProps = FloatingButtonProps & {
  blurIntensty?: number;
};
const BlurredFloatingButton = (
  {
    onPress,
    size = FLOATING_BUTTON_SIZE,
    variant = 'normal',
    children,
    disabled = false,
    accessibilityRole = 'button',
    style,
    blurIntensty = 27,
    ...props
  }: BlurredFloatingButtonProps,
  ref: ForwardedRef<View>,
) => {
  const appearanceStyle = useVariantStyleSheet(computedStyle, variant);

  return (
    <BlurView
      intensity={blurIntensty}
      tint="dark"
      style={[
        { minWidth: size, height: size, borderRadius: size / 2 },
        appearanceStyle.root,
        disabled && appearanceStyle.disabled,
        style,
        { overflow: 'hidden' },
      ]}
    >
      <PressableOpacity
        onPress={onPress}
        accessibilityRole={accessibilityRole}
        style={{
          height: size,
          width: '100%',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        ref={ref}
        {...props}
      >
        {children}
      </PressableOpacity>
    </BlurView>
  );
};

const BlurredFloatingButtonRef = forwardRef(BlurredFloatingButton);

export default BlurredFloatingButtonRef;

export type BlurredFloatingIconButtonProps = FloatingIconButtonProps & {
  blurIntensty?: number;
};

export const BlurredFloatingIconButton = ({
  icon,
  iconSize = 18,
  iconStyle,
  ...props
}: BlurredFloatingIconButtonProps) => (
  <BlurredFloatingButtonRef {...props}>
    <Icon
      icon={icon}
      style={[
        {
          width: iconSize,
          height: iconSize,
        },
        iconStyle,
      ]}
    />
  </BlurredFloatingButtonRef>
);

export const FLOATING_BUTTON_SIZE = 50;

const computedStyle = createVariantsStyleSheet(appearance => ({
  default: {
    root: {
      alignItems: 'center',
      justifyContent: 'center',
      opacity: 1,
    },
    disabled: {
      opacity: 0.3,
    },
    pressed: {
      opacity: 1,
      backgroundColor: appearance === 'light' ? colors.grey50 : colors.grey800,
    },
  },
  normal: {
    root: {
      backgroundColor: appearance === 'light' ? colors.white : colors.black,
      borderColor: appearance === 'light' ? colors.black : colors.white,
      borderWidth: 1,
    },
  },
  grey: {
    root: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor:
        appearance === 'light'
          ? 'rgba(14, 18, 22, 0.4)'
          : 'rgba(14, 18, 22, 0.6)',
      opacity: 1,
    },
    pressed: {
      opacity: 1,
      backgroundColor: 'rgba(255,255,255,0.6)',
    },
  },
}));
