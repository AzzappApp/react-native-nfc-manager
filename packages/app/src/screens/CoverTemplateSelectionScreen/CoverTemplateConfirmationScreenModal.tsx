import { useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { COVER_RATIO } from '@azzapp/shared/coverHelpers';
import { colors } from '#theme';
import { MediaVideoRenderer } from '#components/medias';
import { ScreenModal } from '#components/NativeRouter';
import useScreenInsets from '#hooks/useScreenInsets';
import Button from '#ui/Button';
import IconButton from '#ui/IconButton';
import SafeAreaView from '#ui/SafeAreaView';
import type { CoverTemplate } from './CoverTemplateTypePreviews';
type CoverTemplateConfirmationScreenModalProps = {
  template: CoverTemplate | null;
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
  const mediaCount = template
    ? template.mediaCount -
      template.medias.filter(media => !media.editable).length
    : 0;

  return (
    <ScreenModal visible={!!template} onRequestDismiss={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.close}>
          <IconButton
            icon="close"
            iconStyle={styles.closeIcon}
            variant="icon"
            onPress={onClose}
            style={styles.closeIconContainer}
            hitSlop={{ top: 12, left: 12, bottom: 12, right: 12 }}
          />
        </View>
        <View style={styles.content}>
          {template?.preview.uri && (
            <MediaVideoRenderer
              source={{
                uri: template.preview.uri,
                requestedSize: 512,
                mediaId: template.preview.id,
              }}
              videoEnabled
              muted={false}
              style={styles.template}
              thumbnailURI={template.preview?.thumbnail}
            />
          )}
          {/* //using margin on android  directly on the button create white area */}
          <View style={{ marginBottom: bottom, marginTop: 40 }}>
            <Button
              label={intl.formatMessage(
                {
                  defaultMessage: `{mediaCount, plural,
              =0 {Use this design (No media needed)}
              =1 {Use this design (# media needed)}
              other {Use this design (# media needed)}
            }`,
                  description:
                    'CoverTemplateConfirmationScreenModal - confirmation button',
                },
                {
                  mediaCount,
                },
              )}
              variant="secondary"
              appearance="light"
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
    width: 24,
    height: 24,
  },
  closeIconContainer: {
    width: 24,
    height: 24,
  },
  close: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    top: -12,
    left: -12,
  },
  template: {
    width: '100%',
    borderRadius: 40,
    aspectRatio: COVER_RATIO,
    overflow: 'hidden',
  },
  button: {
    backgroundColor: colors.white,
  },
});

export default CoverTemplateConfirmationScreenModal;
