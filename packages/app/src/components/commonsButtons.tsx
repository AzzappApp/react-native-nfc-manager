import { useIntl } from 'react-intl';
import FloatingIconButton from '#ui/FloatingIconButton';
import HeaderButton from '#ui/HeaderButton';
import IconButton from '#ui/IconButton';
import type { ButtonProps } from '#ui/Button';
import type { IconButtonProps } from '#ui/IconButton';
import type { StyleProp, ViewStyle } from 'react-native';

export type CoverEditionScreensButton = {
  onPress?: () => void;
  style: StyleProp<ViewStyle>;
};

export const CameraButton = ({ onPress, style }: CoverEditionScreensButton) => {
  const intl = useIntl();
  return (
    <FloatingIconButton
      icon="camera"
      iconSize={24}
      onPress={onPress}
      style={style}
      accessibilityLabel={intl.formatMessage({
        defaultMessage: 'Select an image',
        description: 'Accessibility label of the image selection button',
      })}
      accessibilityHint={intl.formatMessage({
        defaultMessage:
          'Press this button to select an image from your library',
        description: 'Accessibility hint of the image selection button',
      })}
    />
  );
};

export const CropButton = ({ onPress, style }: CoverEditionScreensButton) => {
  const intl = useIntl();
  return (
    <FloatingIconButton
      icon="crop"
      iconSize={24}
      onPress={onPress}
      style={style}
      accessibilityLabel={intl.formatMessage({
        defaultMessage: 'Crop',
        description: 'Accessibility label of the crop button',
      })}
      accessibilityHint={intl.formatMessage({
        defaultMessage:
          'Press this button to adjust the boundary of the selected image',
        description: 'Accessibility hint of the crop button',
      })}
    />
  );
};

export const RotateButton = (props: Omit<IconButtonProps, 'icon'>) => {
  const intl = useIntl();
  return (
    <IconButton
      icon="rotate"
      variant="icon"
      accessibilityLabel={intl.formatMessage({
        defaultMessage: 'Rotate',
        description:
          'Accessibility label of the rotate button in media edition screen',
      })}
      accessibilityHint={intl.formatMessage({
        defaultMessage:
          'Rotate the image by 90° clockwise. This will change the crop area.',
        description:
          'Accessibility hint of the rotate button in in media edition screen',
      })}
      {...props}
    />
  );
};

export const CancelHeaderButton = (props: Omit<ButtonProps, 'label'>) => {
  const intl = useIntl();
  return (
    <HeaderButton
      variant="secondary"
      label={intl.formatMessage({
        defaultMessage: 'Cancel',
        description: 'Cancel header button label',
      })}
      {...props}
    />
  );
};

export const DoneHeaderButton = (props: Omit<ButtonProps, 'label'>) => {
  const intl = useIntl();
  return (
    <HeaderButton
      variant="primary"
      label={intl.formatMessage({
        defaultMessage: 'Done',
        description: 'Done header button label',
      })}
      {...props}
    />
  );
};

export const SaveHeaderButton = (props: Omit<ButtonProps, 'label'>) => {
  const intl = useIntl();
  return (
    <HeaderButton
      variant="primary"
      label={intl.formatMessage({
        defaultMessage: 'Save',
        description: 'Save header button label',
      })}
      {...props}
    />
  );
};

export const NextHeaderButton = (props: Omit<ButtonProps, 'label'>) => {
  const intl = useIntl();
  return (
    <HeaderButton
      variant="primary"
      label={intl.formatMessage({
        defaultMessage: 'Next',
        description: 'Next header button label',
      })}
      {...props}
    />
  );
};

export const ResetHeaderButton = (props: Omit<ButtonProps, 'label'>) => {
  const intl = useIntl();
  return (
    <HeaderButton
      variant="secondary"
      label={intl.formatMessage({
        defaultMessage: 'Reset',
        description: 'Reset header button label',
      })}
      {...props}
    />
  );
};
