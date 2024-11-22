import { useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { COVER_RATIO } from '@azzapp/shared/coverHelpers';
import { colors } from '#theme';
import { MediaVideoRenderer } from '#components/medias';
import { ScreenModal } from '#components/NativeRouter';
import useScreenInsets from '#hooks/useScreenInsets';
import Button from '#ui/Button';
import Container from '#ui/Container';
import IconButton from '#ui/IconButton';
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

  const mediaCount = template
    ? template.mediaCount -
      template.medias.filter(media => !media.editable).length
    : 0;

  const insets = useScreenInsets();

  return (
    <ScreenModal visible={!!template} onRequestDismiss={onClose}>
      <Container style={styles.container}>
        <View style={[styles.close, { top: insets.top }]}>
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
          <View style={{ marginBottom: insets.bottom, marginTop: 40 }}>
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
      </Container>
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
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
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
