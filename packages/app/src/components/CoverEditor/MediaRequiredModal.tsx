import { FormattedMessage, useIntl } from 'react-intl';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import ScreenModal from '#components/ScreenModal';
import Button from '#ui/Button';
import Container from '#ui/Container';
import Header from '#ui/Header';
import Icon from '#ui/Icon';
import IconButton from '#ui/IconButton';
import Text from '#ui/Text';

const MediaRequiredModal = ({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose(openPicker: boolean): void;
}) => {
  const intl = useIntl();

  return (
    <ScreenModal visible={visible} animationType="none">
      <Container
        style={{
          flex: 1,
        }}
      >
        <SafeAreaView style={styles.root}>
          <Header
            rightElement={
              <IconButton
                icon="close"
                onPress={() => onClose(false)}
                variant="icon"
              />
            }
          />
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              padding: 20,
            }}
          >
            <Icon
              icon="camera"
              style={{ width: 60, height: 60, marginBottom: 10 }}
            />
            <Text variant="large" style={{ marginBottom: 20 }}>
              <FormattedMessage
                defaultMessage="Add a photo"
                description="Cover editor save phoyo required modal title"
              />
            </Text>
            <Text style={{ marginBottom: 20 }}>
              <FormattedMessage
                defaultMessage="Please, use one of your own photo to create your cover"
                description="Cover editor save photo required modal text"
              />
            </Text>
            <Button
              label={intl.formatMessage({
                defaultMessage: 'Select a photo',
                description:
                  'Cover editor save photo required modal button label',
              })}
              onPress={() => onClose(true)}
            />
          </View>
        </SafeAreaView>
      </Container>
    </ScreenModal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    marginBottom: 180,
    marginTop: 30,
  },
});

export default MediaRequiredModal;
