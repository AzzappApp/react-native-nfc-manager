import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet, View, Modal, SafeAreaView } from 'react-native';
import useCameraPermissions, {
  requestCameraPermission,
  requestMicrophonePermission,
} from '#hooks/useCameraPermissions';
import { requestMediaLibraryPermission } from '#hooks/useMediaLibraryPermission';
import Container from '#ui/Container';
import Header from '#ui/Header';
import IconButton from '#ui/IconButton';
import PermissionScreen from './PermissionScreen';

type CameraModalProps = {
  /**
   * The permission to request.
   */
  permissionsFor: 'gallery' | 'photo' | 'video';
  /**
   * @see https://reactnative.dev/docs/modal#visible
   */
  visible?: boolean;
  /**
   * @see https://reactnative.dev/docs/modal#onrequestclose
   */
  onRequestClose(): void;
};

/**
 * A modal that allows to request permissions from the user.
 */
const PermissionModal = ({
  permissionsFor,
  visible,
  onRequestClose,
}: CameraModalProps) => {
  const intl = useIntl();
  const { cameraPermission } = useCameraPermissions();

  const currentPermission = useMemo(() => {
    switch (permissionsFor) {
      case 'gallery':
        return 'gallery';
      case 'photo':
        return 'camera';
      case 'video':
        if (
          cameraPermission === 'not-determined' ||
          cameraPermission === 'denied'
        ) {
          return 'camera';
        }
        return 'microphone';
    }
  }, [cameraPermission, permissionsFor]);

  const onAllowsCamera = async () => {
    const permission = await requestCameraPermission();

    if (permission === 'denied') {
      return;
    }
    if (permissionsFor === 'video') {
      void requestMicrophonePermission();
    }
  };

  const onAllowsMicrophone = () => {
    void requestMicrophonePermission();
  };

  const onAllowsGallery = async () => {
    void requestMediaLibraryPermission();
  };

  return (
    <Modal
      visible={visible}
      onRequestClose={onRequestClose}
      animationType="slide"
    >
      <Container style={styles.container}>
        <SafeAreaView style={styles.root}>
          <Header
            leftElement={
              <IconButton
                icon="arrow_left"
                onPress={onRequestClose}
                variant="icon"
              />
            }
          />
          {currentPermission === 'camera' && (
            <View style={styles.content}>
              <PermissionScreen
                title={intl.formatMessage({
                  defaultMessage:
                    'Allow Azzapp to access your camera and your microphone',
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
                content={intl.formatMessage({
                  defaultMessage:
                    'Access to the photos allows you to create publications.',
                  description:
                    'Camera authorization screen content for photos permission',
                })}
                onNext={onAllowsGallery}
              />
            </View>
          )}
        </SafeAreaView>
      </Container>
    </Modal>
  );
};

export default PermissionModal;

const styles = StyleSheet.create({
  container: { flex: 1 },
  root: {
    flex: 1,
    marginBottom: 180,
    marginTop: 30,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
});
