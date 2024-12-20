import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';

type PopupButtonProps = {
  onPress: () => void;
  text: JSX.Element | string;
};
export const PopupButton = ({ onPress, text }: PopupButtonProps) => {
  const popupStyles = useStyleSheet(styles);

  return (
    <PressableNative style={popupStyles.popupButtonContainer} onPress={onPress}>
      <Text variant="button" style={popupStyles.popupButtonText}>
        {text}
      </Text>
    </PressableNative>
  );
};

const styles = createStyleSheet(theme => ({
  popupButtonContainer: {
    backgroundColor: theme === 'dark' ? colors.white : colors.black,
    width: '100%',
    height: 47,
    borderRadius: 12,
    justifyContent: 'center',
  },
  popupButtonText: {
    color: theme === 'dark' ? colors.black : colors.white,
    textAlign: 'center',
  },
}));
