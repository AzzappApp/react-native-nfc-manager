import { useIntl } from 'react-intl';
import FloatingIconButton from '#ui/FloatingIconButton';
import type { StyleProp, ViewStyle } from 'react-native/types';

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
