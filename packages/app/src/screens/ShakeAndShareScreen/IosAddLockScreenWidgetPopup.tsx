import { ResizeMode, Video } from 'expo-av';
import { FormattedMessage, useIntl } from 'react-intl';
import { View } from 'react-native';
import { colors } from '#theme';
import BottomSheetPopup from '#components/popup/BottomSheetPopup';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Button from '#ui/Button';
import Text from '#ui/Text';

const IosAddLockScreenWidgetPopup = ({
  visible,
  onHide,
}: {
  visible: boolean;
  onHide: () => void;
}) => {
  const styles = useStyleSheet(stylesheet);

  const intl = useIntl();

  return (
    <BottomSheetPopup
      visible={visible}
      onDismiss={onHide}
      isAnimatedContent
      fullScreen
    >
      <View style={styles.popupContainer}>
        <View style={styles.popupPage}>
          <Video
            style={styles.popupIllustration}
            isLooping
            isMuted
            shouldPlay
            resizeMode={ResizeMode.COVER}
            source={require('#assets/iosLockScreenWidget.mp4')}
          />
          <Text variant="large" style={styles.popupHeaderTextContainer}>
            <FormattedMessage
              defaultMessage="Add QR-Code to lockscreen"
              description="Popup add widget to lock screen / main message"
            />
          </Text>
          <Text variant="medium" style={styles.popupDescriptionTextContainer}>
            <FormattedMessage
              defaultMessage="Add your azzapp QR-Code as a widget to your iphone Lockscreen"
              description="Popup add widget to lock screen / secondary message description / explanation add QRCode on lock screen"
            />
          </Text>
        </View>
        <Button
          onPress={onHide}
          label={intl.formatMessage({
            defaultMessage: 'Ok',
            description: 'Popup add widget to home screen / ok buton on popup',
          })}
        />
      </View>
    </BottomSheetPopup>
  );
};

const stylesheet = createStyleSheet(appearance => ({
  popupContainer: {
    backgroundColor: appearance === 'dark' ? colors.grey900 : colors.white,
    width: 295,
    borderRadius: 20,
    alignSelf: 'center',
    padding: 20,
    alignContent: 'center',
    marginTop: '25%',
  },
  popupIllustration: {
    height: 420,
    borderRadius: 12,
  },
  popupPage: { top: 0, width: '100%', paddingBottom: 20 },
  popupHeaderTextContainer: {
    color: appearance === 'dark' ? colors.white : colors.black,
    paddingTop: 20,
    textAlign: 'center',
  },
  popupDescriptionTextContainer: {
    color: appearance === 'dark' ? colors.white : colors.black,
    paddingTop: 10,
    textAlign: 'center',
  },
}));

export default IosAddLockScreenWidgetPopup;
