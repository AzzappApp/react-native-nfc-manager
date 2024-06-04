import { Image } from 'expo-image';
import { useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { colors } from '#theme';
import ScreenModal from '#components/ScreenModal';
import Button from '#ui/Button';
import IconButton from '#ui/IconButton';
import SafeAreaView from '#ui/SafeAreaView';
import type { TemplateTypePreview } from './CoverEditorTemplateTypePreviews';

type Props = {
  template: TemplateTypePreview | null;
  onClose: () => void;
  onConfirm: () => void;
};

const CoverEditorTemplateConfirmationScreenModal = ({
  template,
  onClose,
  onConfirm,
}: Props) => {
  const intl = useIntl();

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
          {template && (
            <Image
              source={{ uri: template?.media.uri }}
              style={[
                styles.template,
                {
                  aspectRatio: template.media.width / template.media.height,
                },
              ]}
            />
          )}
          <Button
            label={intl.formatMessage({
              defaultMessage: 'Use this template',
              description:
                'CoverEditorTemplateConfirmationScreenModal - confirmation button',
            })}
            variant="secondary"
            style={styles.button}
            onPress={onConfirm}
          />
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
    position: 'relative',
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
  },
  button: {
    backgroundColor: colors.white,
    marginTop: 40,
  },
});

export default CoverEditorTemplateConfirmationScreenModal;
