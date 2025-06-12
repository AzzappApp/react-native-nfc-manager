import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Linking, View, StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';
import VersionCheck from 'react-native-version-check';
import { colors } from '#theme';
import BottomSheetPopup from '#components/popup/BottomSheetPopup';
import Button from '#ui/Button';
import PressableOpacity from '#ui/PressableOpacity';
import Text from '#ui/Text';

export const HomeScreenUpgradePopup = () => {
  const [needUpdate, setNeedUpdate] = useState<{
    isNeeded: boolean;
    currentVersion: string;
    latestVersion: string;
    storeUrl: string;
  }>();
  useEffect(() => {
    VersionCheck.needUpdate({
      // keep this line commented for easier testing
      // packageName: 'com.azzapp.app',
      // keep this line commented for easier testing
      //currentVersion: '1.0.0',
    }).then(needUpdate => {
      if (needUpdate?.isNeeded) {
        setNeedUpdate(needUpdate);
      }
    });
  }, []);

  const closeMultiUserInfo = useCallback(() => {
    setNeedUpdate(undefined);
  }, []);
  const intl = useIntl();
  const updateApp = useCallback(async () => {
    if (needUpdate?.storeUrl) {
      if (await Linking.canOpenURL(needUpdate.storeUrl)) {
        await Linking.openURL(needUpdate.storeUrl);
      } else {
        Toast.show({
          type: 'error',
          text1: intl.formatMessage({
            defaultMessage: 'Cannot open application store',
            description: 'Error toast message when opening app store fails.',
          }),
        });
      }
    }
  }, [intl, needUpdate?.storeUrl]);

  return (
    <BottomSheetPopup
      visible={!!needUpdate}
      onDismiss={closeMultiUserInfo}
      isAnimatedContent
      fullScreen
    >
      <View style={styles.container}>
        <View style={styles.imageContainer}>
          <Image
            source={require('#assets/upgrade-app.png')}
            style={styles.image}
            contentFit="contain"
          />
        </View>
        <View style={styles.textContainer}>
          <Text variant="large" style={styles.headerText}>
            <FormattedMessage
              defaultMessage="A new version is available"
              description="HomeScreenUpgradePopup - header"
            />
          </Text>
          <Text variant="medium" style={styles.descriptionText}>
            <FormattedMessage
              defaultMessage="We’ve made azzapp even better. Update now to enjoy:"
              description="HomeScreenUpgradePopup - description"
            />
          </Text>
          {/* This View removes gaps between points */}
          <View>
            <Text variant="medium" style={styles.descriptionText}>
              {'\u2022 '}
              <FormattedMessage
                defaultMessage="Improved AI contact enrichment"
                description="HomeScreenUpgradePopup - bullet point 1"
              />
            </Text>
            <Text variant="medium" style={styles.descriptionText}>
              {'\u2022 '}
              <FormattedMessage
                defaultMessage="Performance upgrades and bug fixes"
                description="HomeScreenUpgradePopup - bullet point 2"
              />
            </Text>
          </View>
        </View>

        <Button
          label={intl.formatMessage({
            defaultMessage: 'Update',
            description: 'HomeScreenUpgradePopup - Update button label',
          })}
          style={styles.updateButton}
          textStyle={styles.updateButtonText}
          onPress={updateApp}
        />
        <PressableOpacity onPress={closeMultiUserInfo}>
          <Text variant="medium" style={styles.cancelButtonText}>
            <FormattedMessage
              defaultMessage="Remind me latter"
              description="HomeScreenUpgradePopup - remind me latter"
            />
          </Text>
        </PressableOpacity>
      </View>
    </BottomSheetPopup>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    width: '80%',
    borderRadius: 20,
    alignSelf: 'center',
    padding: 20,
    alignContent: 'center',
    gap: 20,
    top: 143,
  },
  imageContainer: {
    width: '100%',
    height: 407,
    overflow: 'hidden',
  },
  image: {
    top: -60,
    width: '120%',
    height: 407,
    alignSelf: 'center',
  },
  textContainer: {
    gap: 10,
    // negative marginTop in order to have text over the image
    marginTop: -190,
  },
  descriptionText: { color: colors.black },
  headerText: { textAlign: 'center', color: colors.black },
  updateButton: { backgroundColor: colors.red400 },
  updateButtonText: { color: colors.white },
  cancelButtonText: {
    width: '100%',
    color: colors.grey200,
    textAlign: 'center',
  },
});
