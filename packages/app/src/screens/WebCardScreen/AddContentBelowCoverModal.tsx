import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { colors } from '#theme';
import CoverRenderer from '#components/CoverRenderer';
import { ScreenModal } from '#components/NativeRouter';
import Container from '#ui/Container';
import Header from '#ui/Header';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import SafeAreaView from '#ui/SafeAreaView';
import TabsBar from '#ui/TabsBar';
import Text from '#ui/Text';
import AddContentBelowCoverSections from './AddContentBelowCoverSections';
import AddContentBelowCoverTemplates from './AddContentBelowCoverTemplates';
import type { AddContentBelowCoverModal_webCard$key } from '#relayArtifacts/AddContentBelowCoverModal_webCard.graphql';

type Props = {
  open: boolean;
  onClose: () => void;
  webCard: AddContentBelowCoverModal_webCard$key;
};

const AddContentBelowCoverModal = ({
  open,
  onClose,
  webCard: webCardKey,
}: Props) => {
  const webCard = useFragment(
    graphql`
      fragment AddContentBelowCoverModal_webCard on WebCard {
        ...CoverRenderer_webCard
        isPremium
        userName
      }
    `,
    webCardKey,
  );

  const intl = useIntl();

  const [currentTab, setCurrentTab] = useState<string>('sections');

  const tabs = useMemo(
    () => [
      {
        tabKey: 'sections',
        label: intl.formatMessage({
          defaultMessage: 'Sections',
          description: 'Sections tab label in BelowCoverModal',
        }),
      },
      {
        tabKey: 'templates',
        label: intl.formatMessage({
          defaultMessage: 'Templates',
          description: 'Templates tab label in BelowCoverModal',
        }),
      },
    ],
    [intl],
  );

  return (
    <ScreenModal
      visible={open}
      animationType="slide"
      onRequestDismiss={onClose}
    >
      <Container style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          <Header
            middleElement={
              <View style={{ flexDirection: 'column', alignItems: 'center' }}>
                <Text variant="large">
                  <FormattedMessage
                    defaultMessage="Add content"
                    description="Title for add content below cover modal"
                  />
                </Text>
                <Text variant="medium" style={{ color: colors.grey400 }}>
                  <FormattedMessage
                    defaultMessage="below your cover"
                    description="Subtitle for add content below cover modal"
                  />
                </Text>
              </View>
            }
            leftElement={
              <PressableNative onPress={onClose}>
                <Icon icon="arrow_down" />
              </PressableNative>
            }
          />
          <View
            style={{
              alignItems: 'center',
              marginTop: 15,
            }}
          >
            <View
              style={{
                position: 'relative',
              }}
            >
              <CoverRenderer
                webCard={webCard}
                width={113}
                large
                useAnimationSnapshot
                style={{ borderRadius: 15, overflow: 'hidden' }}
              />
              <LinearGradient
                colors={['rgba(255,255,255,0)', '#fff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                locations={[0, 0.95]}
                style={styles.mediaLinear}
              />
            </View>
          </View>
          <TabsBar
            currentTab={currentTab}
            onTabPress={setCurrentTab}
            tabs={tabs}
            decoration="underline"
          />
          {currentTab === 'sections' && <AddContentBelowCoverSections />}
          {currentTab === 'templates' && (
            <AddContentBelowCoverTemplates
              isPremium={webCard.isPremium}
              userName={webCard.userName}
            />
          )}
        </SafeAreaView>
      </Container>
    </ScreenModal>
  );
};

const styles = StyleSheet.create({
  mediaLinear: {
    position: 'absolute',
    zIndex: 1,
    top: -1,
    left: -1,
    width: 115,
    height: 190,
  },
});

export default AddContentBelowCoverModal;
