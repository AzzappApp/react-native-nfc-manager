import { useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { colors } from '#theme';
import { ScreenModal } from '#components/NativeRouter';
import Container from '#ui/Container';
import Header from '#ui/Header';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import SafeAreaView from '#ui/SafeAreaView';
import TabsBar from '#ui/TabsBar';
import Text from '#ui/Text';
import CardModuleSectionList from './CardModuleSectionList';
import CardTemplatesList from './CardTemplatesList';
import type { CardTemplatesList_webCard$key } from '#relayArtifacts/CardTemplatesList_webCard.graphql';

type Props = {
  open: boolean;
  close: () => void;
  webCard: CardTemplatesList_webCard$key;
};

const AddModuleSectionModal = ({ open, close, webCard: webCardKey }: Props) => {
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
    <ScreenModal visible={open} animationType="slide" onRequestDismiss={close}>
      <Container style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          <Header
            middleElement={
              <View style={styles.headerTitle}>
                <Text variant="large">
                  <FormattedMessage
                    defaultMessage="Add content"
                    description="Title for add content cover modal"
                  />
                </Text>
                <Text variant="medium" style={styles.headerSubtitle}>
                  <FormattedMessage
                    defaultMessage="below your cover"
                    description="Subtitle for add content cover modal"
                  />
                </Text>
              </View>
            }
            leftElement={
              <PressableNative onPress={close}>
                <Icon icon="arrow_down" />
              </PressableNative>
            }
          />
          <TabsBar
            currentTab={currentTab}
            onTabPress={setCurrentTab}
            tabs={tabs}
            decoration="underline"
          />
          {currentTab === 'sections' && <CardModuleSectionList close={close} />}
          {currentTab === 'templates' && (
            <CardTemplatesList webCardKey={webCardKey} />
          )}
        </SafeAreaView>
      </Container>
    </ScreenModal>
  );
};

const styles = StyleSheet.create({
  headerSubtitle: { color: colors.grey400 },
  headerTitle: { flexDirection: 'column', alignItems: 'center' },
});

export default AddModuleSectionModal;
