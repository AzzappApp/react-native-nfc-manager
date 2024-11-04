import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet, View, SafeAreaView, Linking } from 'react-native';
import { RESULTS } from 'react-native-permissions';

import { colors } from '#theme';
import { ScreenModal } from '#components/NativeRouter';
import { usePermissionContext } from '#helpers/PermissionContext';
import Container from '#ui/Container';
import Header from '#ui/Header';
import IconButton from '#ui/IconButton';
import Text from '#ui/Text';
import PermissionScreen from './PermissionScreen';

type CameraModalProps = {
  /**
   * The permission to request.
   */
  permissionsFor: 'gallery' | 'photo' | 'video';
  /**
   * @see https://reactnative.dev/docs/modal#onrequestclose
   */
  onRequestClose?: () => void;
  /**
   * allow the popup to auto focus based on condition
   *
   * @type {boolean}
   * @default true
   */
  autoFocus?: boolean;
};

/**
 * A modal that allows to request permissions from the user.
 */
const PermissionModal = ({
  permissionsFor,
  onRequestClose = () => {},
  autoFocus = true,
}: CameraModalProps) => {
  const intl = useIntl();
  const {
    mediaPermission,
    requestMediaPermission,
    cameraPermission,
    requestCameraPermission,
    audioPermission,
    requestAudioPermission,
  } = usePermissionContext();

  const showPermissionModal = useMemo(() => {
    switch (permissionsFor) {
      case 'gallery':
        return (
          mediaPermission !== RESULTS.GRANTED &&
          mediaPermission !== RESULTS.LIMITED
        );
      case 'photo':
        return cameraPermission !== RESULTS.GRANTED;

      case 'video':
        return !(
          cameraPermission === RESULTS.GRANTED &&
          audioPermission === RESULTS.GRANTED
        );
    }
  }, [audioPermission, cameraPermission, mediaPermission, permissionsFor]);

  const currentPermission = useMemo(() => {
    switch (permissionsFor) {
      case 'gallery':
        return 'gallery';
      case 'photo':
        return 'camera';
      case 'video':
        if (cameraPermission !== RESULTS.GRANTED) {
          return 'camera';
        }
        return 'microphone';
    }
  }, [cameraPermission, permissionsFor]);

  const onAllowsCamera = async () => {
    if (cameraPermission === RESULTS.DENIED) {
      requestCameraPermission();
    } else {
      Linking.openSettings();
    }
  };

  const onAllowsMicrophone = () => {
    if (audioPermission === RESULTS.DENIED) {
      requestAudioPermission();
    } else {
      Linking.openSettings();
    }
  };

  const onAllowsGallery = async () => {
    if (mediaPermission === RESULTS.DENIED) {
      requestMediaPermission();
    } else {
      Linking.openSettings();
    }
  };

  return (
    <ScreenModal
      visible={showPermissionModal && autoFocus}
      onRequestDismiss={onRequestClose}
    >
      <Container style={styles.container}>
        <SafeAreaView style={styles.root}>
          <Header
            rightElement={
              <IconButton
                icon="close"
                onPress={onRequestClose}
                variant="icon"
              />
            }
          />
          {currentPermission === 'camera' && (
            <View style={styles.content}>
              <PermissionScreen
                title={intl.formatMessage({
                  defaultMessage: 'Allow Azzapp to access your camera',
                  description:
                    'Camera authorization screen title for camera permission',
                })}
                content={intl.formatMessage({
                  defaultMessage:
                    'Access to your camera allows you to take photos and record videos. Access to the microphone allows you to record videos.',
                  description:
                    'Camera authorization screen content for camera permission',
                })}
                onNext={onAllowsCamera}
              />
            </View>
          )}
          {currentPermission === 'microphone' && (
            <View style={styles.content}>
              <PermissionScreen
                title={intl.formatMessage({
                  defaultMessage: 'Allow Azzapp to access your microphone',
                  description:
                    'Camera authorization screen title for microphobe permission',
                })}
                content={intl.formatMessage({
                  defaultMessage:
                    'Access to the microphone allows you to record videos.',
                  description:
                    'Camera authorization screen content for microphone permission',
                })}
                onNext={onAllowsMicrophone}
              />
            </View>
          )}
          {currentPermission === 'gallery' && (
            <View style={styles.content}>
              <PermissionScreen
                title={intl.formatMessage({
                  defaultMessage: 'Allow Azzapp to access your photos',
                  description:
                    'Camera authorization screen title for photos permission',
                })}
                content={intl.formatMessage(
                  {
                    defaultMessage:
                      'Access to the media library allows you to create posts, Covers{azzappA}, and to add images to your WebCard{azzappA}.',
                    description:
                      'Camera authorization screen content for photos permission',
                  },
                  {
                    azzappA: (
                      <Text variant="azzapp" style={{ color: colors.red400 }}>
                        a
                      </Text>
                    ),
                  },
                )}
                onNext={onAllowsGallery}
              />
            </View>
          )}
        </SafeAreaView>
      </Container>
    </ScreenModal>
  );
};

export default PermissionModal;

const styles = StyleSheet.create({
  container: { flex: 1 },
  root: {
    flex: 1,
    marginBottom: 180,
    marginTop: 80,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
});
