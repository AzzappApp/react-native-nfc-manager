import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet, View, Modal, SafeAreaView, Linking } from 'react-native';
import useCameraPermissions, {
  requestCameraPermission,
  requestMicrophonePermission,
} from '#hooks/useCameraPermissions';
import FadeSwitch from '#ui/FadeSwitch';
import IconButton from '#ui/IconButton';
import Header from '../Header';
import PermissionScreen from './PermissionScreen';

type CameraModalProps = {
  permissionsFor: 'gallery' | 'photo' | 'video';
  visible?: boolean;
  onRequestClose(): void;
};

const PermissionModal = ({
  permissionsFor,
  visible,
  onRequestClose,
}: CameraModalProps) => {
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
    await Linking.openSettings();
    return;
  };

  const intl = useIntl();

  return (
    <Modal
      visible={visible}
      onRequestClose={onRequestClose}
      animationType="slide"
    >
      <SafeAreaView style={styles.root}>
        <Header
          leftButton={<IconButton icon="chevron" onPress={onRequestClose} />}
        />
        <FadeSwitch currentKey={currentPermission} transitionDuration={220}>
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
        </FadeSwitch>
      </SafeAreaView>
    </Modal>
  );
};

export default PermissionModal;

const styles = StyleSheet.create({
  root: {
    backgroundColor: 'white',
    flex: 1,
    marginBottom: 150,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'white',
    padding: 20,
  },
});
