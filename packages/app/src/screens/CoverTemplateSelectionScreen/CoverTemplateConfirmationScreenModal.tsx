import { ResizeMode, Video } from 'expo-av';
import { Image } from 'expo-image';
import { useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { COVER_RATIO } from '@azzapp/shared/coverHelpers';
import { colors } from '#theme';
import ScreenModal from '#components/ScreenModal';
import useScreenInsets from '#hooks/useScreenInsets';
import Button from '#ui/Button';
import IconButton from '#ui/IconButton';
import SafeAreaView from '#ui/SafeAreaView';
import type { CoverTemplatePreview } from './useCoverTemplates';

type CoverTemplateConfirmationScreenModalProps = {
  template: CoverTemplatePreview | null;
  onClose: () => void;
  onConfirm: () => void;
};

const CoverTemplateConfirmationScreenModal = ({
  template,
  onClose,
  onConfirm,
}: CoverTemplateConfirmationScreenModalProps) => {
  const intl = useIntl();

  const { bottom } = useScreenInsets();
  return (
    <ScreenModal visible={!!template}>
      <SafeAreaView style={styles.container}>
        <View style={styles.close}>
          <IconButton
            icon="close"
            iconStyle={styles.closeIcon}
            variant="icon"
            onPress={onClose}
          />
        </View>
        <View style={styles.content}>
          {template?.preview?.video?.uri ? (
            //try to use MediaVideoRenderer here, but did not work and,
            // having to pass requestedSize and id in source does not make sens has the uri is already optimized for a preview
            // we can do it later, @Upmitt need this feature asap
            <Video
              source={{ uri: template.preview.video.uri }}
              isMuted={false}
              isLooping
              style={styles.template}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay
            />
          ) : (
            <Image
              source={{
                uri:
                  template?.preview.video?.thumbnail ??
                  template?.preview.image?.uri,
              }}
              style={styles.template}
            />
          )}
          {/* //using margin on android  directly on the button create white area */}
          <View style={{ marginBottom: bottom, marginTop: 40 }}>
            <Button
              label={intl.formatMessage({
                defaultMessage: 'Use this template',
                description:
                  'CoverTemplateConfirmationScreenModal - confirmation button',
              })}
              variant="secondary"
              style={styles.button}
              onPress={onConfirm}
            />
          </View>
        </View>
      </SafeAreaView>
    </ScreenModal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
    paddingHorizontal: 20,
    justifyContent: 'flex-start',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  closeIcon: {
    tintColor: colors.white,
  },
  close: {
    width: 24,
    height: 24,
  },
  template: {
    width: '100%',
    borderRadius: 40,
    aspectRatio: COVER_RATIO,
  },
  button: {
    backgroundColor: colors.white,
  },
});

export default CoverTemplateConfirmationScreenModal;
