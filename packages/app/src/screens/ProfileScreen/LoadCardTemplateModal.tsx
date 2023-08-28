import { Suspense, useState } from 'react';
import { useIntl } from 'react-intl';
import { Modal, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CardTemplateList from '#components/CardTemplateList';
import useLoadCardTemplateMutation from '#hooks/useLoadCardTemplateMutation';
import ActivityIndicator from '#ui/ActivityIndicator';
import Button from '#ui/Button';
import Icon from '#ui/Icon';
import IconButton from '#ui/IconButton';
import Text from '#ui/Text';

type LoadCardTemplateModalProps = {
  onClose: () => void;
  visible: boolean;
};

const LoadCardTemplateModal = (props: LoadCardTemplateModalProps) => {
  const { visible, onClose } = props;

  const [cardTemplateId, setCardTemplateId] = useState<string | null>(null);

  const intl = useIntl();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  const height = windowHeight - insets.top - insets.bottom - HEADER_HEIGHT;

  const [commit, inFlight] = useLoadCardTemplateMutation();

  const onSubmit = () => {
    if (!cardTemplateId) return;

    commit({
      variables: {
        loadCardTemplateInput: {
          cardTemplateId,
        },
      },
      onCompleted: () => {
        setCardTemplateId(null);
        onClose();
      },
    });
  };

  return (
    <Modal animationType="none" visible={visible}>
      <View style={styles.header}>
        <View style={styles.headerSegment}>
          <IconButton
            icon={'arrow_down'}
            onPress={onClose}
            iconSize={28}
            variant="icon"
            style={styles.backIcon}
          />
        </View>
        <View style={styles.titleTextContainer}>
          <Text variant="large" style={styles.titleText}>
            {intl.formatMessage({
              defaultMessage: 'Load a WebCard® template',
              description: 'WebCard creation screen title',
            })}
          </Text>
        </View>
      </View>
      <View style={[styles.wrapper, { height }]}>
        <Suspense
          fallback={
            <View style={styles.activityIndicatorContainer}>
              <ActivityIndicator />
            </View>
          }
        >
          <CardTemplateList
            height={height}
            onApplyTemplate={(cardTemplateId: string) =>
              setCardTemplateId(cardTemplateId)
            }
            loading={inFlight}
          />
        </Suspense>
      </View>

      <Modal
        animationType="none"
        visible={visible && !!cardTemplateId && !inFlight}
      >
        <View style={styles.confirmation}>
          <Icon icon="warning" style={styles.icon} />
          <Text variant="large" style={{ marginTop: 10 }}>
            {intl.formatMessage({
              defaultMessage: 'Delete your current WebCard contents?',
              description: 'Confirmation title for load card template modal',
            })}
          </Text>
          <Text
            style={{
              marginTop: 20,
              textAlign: 'center',
              paddingHorizontal: 20,
            }}
          >
            {intl.formatMessage({
              defaultMessage:
                'Loading a new template will remove current contents of your WebCarda and replace them with the new template. Are you ready to start from the scratch?',
              description:
                'Confirmation description for load card template modal',
            })}
          </Text>
          <View style={styles.buttons}>
            <Button
              style={{ marginTop: 20, width: '100%' }}
              label={intl.formatMessage({
                defaultMessage: 'Remove current contents',
                description: 'Confirmation button for load card template modal',
              })}
              onPress={onSubmit}
            />
            <Button
              style={{ marginTop: 10, width: '100%' }}
              variant="secondary"
              label={intl.formatMessage({
                defaultMessage: 'Cancel',
                description: 'Cancel button for load card template modal',
              })}
              onPress={() => setCardTemplateId(null)}
            />
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const HEADER_HEIGHT = 70;

export default LoadCardTemplateModal;

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 45,
    marginBottom: 20,
    paddingHorizontal: 20,
    flex: 1,
  },
  headerSegment: {
    width: 40,
  },
  backIcon: {
    height: 17,
    width: 10,
  },
  titleTextContainer: {
    flex: 1,
    alingSelft: 'stretch',
  },
  titleText: {
    textAlign: 'center',
    paddingTop: 0,
    textAlignVertical: 'center',
  },
  activityIndicatorContainer: {
    flex: 1,
    alignItems: 'center',
    marginTop: 200,
  },
  confirmation: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  icon: {
    width: 60,
    height: 60,
  },
  buttons: {
    display: 'flex',
    flexDirection: 'column',
    paddingHorizontal: 40,
    width: '100%',
  },
});
