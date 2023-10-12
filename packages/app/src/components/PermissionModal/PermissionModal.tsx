import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet, View, Modal, SafeAreaView, Linking } from 'react-native';
import { RESULTS } from 'react-native-permissions';
import {
  useMediaPermission,
  useCameraPermission,
  useAudioPermission,
} from '#hooks/usePermissions';
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
  onRequestClose,
}: CameraModalProps) => {
  const intl = useIntl();
  const { mediaPermission, askMediaPermission } = useMediaPermission();
  const { cameraPermission, askCameraPermission } = useCameraPermission();
  const { audioPermission, askAudioPermission } = useAudioPermission();

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
      askCameraPermission();
    } else {
      Linking.openSettings();
    }
  };

  const onAllowsMicrophone = () => {
    if (audioPermission === RESULTS.DENIED) {
      askAudioPermission();
    } else {
      Linking.openSettings();
    }
  };

  const onAllowsGallery = async () => {
    if (mediaPermission === RESULTS.DENIED) {
      askMediaPermission();
    } else {
      Linking.openSettings();
    }
  };

  return (
    <Modal
      visible={showPermissionModal}
      onRequestClose={onRequestClose}
      animationType="slide"
    >
      <Container style={styles.container}>
        <SafeAreaView style={styles.root}>
          <Header
            leftElement={
              <IconButton
                icon="arrow_down"
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
