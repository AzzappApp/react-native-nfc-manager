import { ResizeMode, Video } from 'expo-av';
import { FormattedMessage, useIntl } from 'react-intl';
import { View } from 'react-native';
import { colors } from '#theme';
import BottomSheetPopup from '#components/popup/BottomSheetPopup';
import { PopupButton } from '#components/popup/PopupElements';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Text from '#ui/Text';

const IosAddWidgetPopup = ({
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
            source={require('#assets/iosWidget.mp4')}
          />
          <Text variant="large" style={styles.popupHeaderTextContainer}>
            <FormattedMessage
              defaultMessage="Add QR-Code to homescreen"
              description="Popup add widget to home screen / main message"
            />
          </Text>
          <Text variant="medium" style={styles.popupDescriptionTextContainer}>
            <FormattedMessage
              defaultMessage="Add your azzapp QR-Code as a widget to your iphone Homescreen"
              description="Popup add widget to home screen / secondary message description / explanation add QRCode on home screen"
            />
          </Text>
        </View>
        <PopupButton
          onPress={onHide}
          text={intl.formatMessage({
            defaultMessage: 'Ok',
            description: 'Popup add widget to home screen / ok buton on popup',
          })}
        />
      </View>
    </BottomSheetPopup>
  );
};

const stylesheet = createStyleSheet(theme => ({
  popupContainer: {
    backgroundColor: theme === 'dark' ? colors.grey900 : colors.white,
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
    color: theme === 'dark' ? colors.white : colors.black,
    paddingTop: 20,
    textAlign: 'center',
  },
  popupDescriptionTextContainer: {
    color: theme === 'dark' ? colors.white : colors.black,
    paddingTop: 10,
    textAlign: 'center',
  },
}));

export default IosAddWidgetPopup;
