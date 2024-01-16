import { Suspense, useCallback, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Toast from 'react-native-toast-message';
import { graphql, useFragment } from 'react-relay';
import CardTemplateList from '#components/CardTemplateList';
import ScreenModal from '#components/ScreenModal';
import useLoadCardTemplateMutation from '#hooks/useLoadCardTemplateMutation';
import useScreenInsets from '#hooks/useScreenInsets';
import ActivityIndicator from '#ui/ActivityIndicator';
import Button from '#ui/Button';
import Container from '#ui/Container';
import Header, { HEADER_HEIGHT } from '#ui/Header';
import HeaderButton from '#ui/HeaderButton';
import Icon from '#ui/Icon';
import IconButton from '#ui/IconButton';
import Text from '#ui/Text';
import type { CardTemplatelistHandle } from '#components/CardTemplateList';
import type { LoadCardTemplateModal_profile$key } from '#relayArtifacts/LoadCardTemplateModal_profile.graphql';

type LoadCardTemplateModalProps = {
  onClose: () => void;
  visible: boolean;
  profile: LoadCardTemplateModal_profile$key;
};

const LoadCardTemplateModal = ({
  onClose,
  visible,
  profile: profileKey,
}: LoadCardTemplateModalProps) => {
  const [cardTemplateId, setCardTemplateId] = useState<string | null>(null);

  const profile = useFragment(
    graphql`
      fragment LoadCardTemplateModal_profile on WebCard {
        cardModules {
          id
        }
      }
    `,
    profileKey,
  );

  const intl = useIntl();
  const insets = useScreenInsets();
  const { height: windowHeight } = useWindowDimensions();
  const height = windowHeight - insets.top - insets.bottom - HEADER_HEIGHT;

  const [commit, inFlight] = useLoadCardTemplateMutation();

  const commitCardTemplate = useCallback(
    (id: string) => {
      commit({
        variables: {
          loadCardTemplateInput: {
            cardTemplateId: id,
          },
        },
        onCompleted: () => {
          setCardTemplateId(null);
          onClose();
        },
        onError: error => {
          console.error(error);
          Toast.show({
            type: 'error',
            text1: intl.formatMessage({
              defaultMessage: 'Error, could not load the template',
              description: 'Load card template modal error toast',
            }),
          });
        },
      });
    },
    [commit, intl, onClose],
  );

  const cardTemplatehandle = useRef<CardTemplatelistHandle>(null);
  const onSubmit = useCallback(() => {
    if (!cardTemplateId) return;
    commitCardTemplate(cardTemplateId);
  }, [cardTemplateId, commitCardTemplate]);

  const showWarning = Boolean(profile.cardModules?.length);

  const applyTemplate = useCallback(
    (templateId: string) => {
      setCardTemplateId(templateId);
      if (!showWarning) {
        commitCardTemplate(templateId);
      }
    },
    [commitCardTemplate, showWarning],
  );

  return (
    <>
      <ScreenModal animationType="none" visible={visible}>
        <Container
          style={{
            flex: 1,
            paddingBottom: insets.bottom,
            paddingTop: insets.top,
          }}
        >
          <Header
            leftElement={
              <IconButton
                icon="arrow_down"
                onPress={onClose}
                iconSize={28}
                variant="icon"
              />
            }
            middleElement={intl.formatMessage({
              defaultMessage: 'Load a template',
              description: 'WebCard creation screen title',
            })}
            rightElement={
              <HeaderButton
                onPress={() => cardTemplatehandle.current?.onSubmit()}
                label={intl.formatMessage({
                  defaultMessage: 'Apply',
                  description: 'Apply button label in card template preview',
                })}
                loading={inFlight}
              />
            }
            style={{ marginBottom: 10 }}
          />
          <Suspense
            fallback={
              <View style={styles.activityIndicatorContainer}>
                <ActivityIndicator />
              </View>
            }
          >
            <CardTemplateList
              height={height}
              onApplyTemplate={applyTemplate}
              loading={inFlight}
              ref={cardTemplatehandle}
            />
          </Suspense>
        </Container>
      </ScreenModal>
      <ScreenModal
        animationType="none"
        visible={visible && !!cardTemplateId && !inFlight && showWarning}
      >
        <Container style={styles.confirmation}>
          <Icon icon="warning" style={styles.icon} />
          <Text variant="large" style={{ marginTop: 10 }}>
            <FormattedMessage
              defaultMessage="Delete your current WebCard{azzappA} contents?"
              description="Confirmation title for load card template modal"
              values={{
                azzappA: <Text variant="azzapp">a</Text>,
              }}
            />
          </Text>
          <Text
            style={{
              marginTop: 20,
              textAlign: 'center',
              paddingHorizontal: 20,
            }}
          >
            <FormattedMessage
              defaultMessage="Loading a new template will remove current contents of your WebCard{azzappA} and replace them with the new template. Are you ready to start from the scratch?"
              description="Confirmation description for load card template modal"
              values={{
                azzappA: <Text variant="azzapp">a</Text>,
              }}
            />
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
        </Container>
      </ScreenModal>
    </>
  );
};

export default LoadCardTemplateModal;

const styles = StyleSheet.create({
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
