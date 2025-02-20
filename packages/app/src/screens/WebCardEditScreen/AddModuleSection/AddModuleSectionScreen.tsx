import { FormattedMessage } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { graphql, usePreloadedQuery } from 'react-relay';
import { colors } from '#theme';
import { useRouter } from '#components/NativeRouter';
import relayScreen from '#helpers/relayScreen';
import Container from '#ui/Container';
import Header from '#ui/Header';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import SafeAreaView from '#ui/SafeAreaView';
import Text from '#ui/Text';
import CardModuleSectionList from './CardModuleSectionList';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { AddModuleSectionScreenQuery } from '#relayArtifacts/AddModuleSectionScreenQuery.graphql';
import type { AddModuleSectionRoute } from '#routes';

const addModuleSectionScreenQuery = graphql`
  query AddModuleSectionScreenQuery($webCardId: ID!) {
    node(id: $webCardId) {
      ... on WebCard @alias(as: "webCard") {
        ...CardModuleSectionList_webCard
        ...CardTemplatesList_webCard
      }
    }
  }
`;

const AddModuleSectionScreen = ({
  preloadedQuery,
}: RelayScreenProps<AddModuleSectionRoute, AddModuleSectionScreenQuery>) => {
  const node = usePreloadedQuery(addModuleSectionScreenQuery, preloadedQuery);
  const webCard = node.node?.webCard;
  const router = useRouter();

  // const [currentTab, setCurrentTab] = useState<string>('sections');

  // const tabs = useMemo(
  //   () => [
  //     {
  //       tabKey: 'sections',
  //       label: intl.formatMessage({
  //         defaultMessage: 'Sections',
  //         description: 'Sections tab label in BelowCoverModal',
  //       }),
  //     },
  //     {
  //       tabKey: 'templates',
  //       label: intl.formatMessage({
  //         defaultMessage: 'Templates',
  //         description: 'Templates tab label in BelowCoverModal',
  //       }),
  //     },
  //   ],
  //   [intl],
  // );

  return (
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
            <PressableNative onPress={router.back}>
              <Icon icon="arrow_down" />
            </PressableNative>
          }
        />
        <CardModuleSectionList webCardKey={webCard!} />

        {/* STAGING: temporary disable templates webcard
           <TabsBar
            currentTab={currentTab}
            onTabPress={setCurrentTab}
            tabs={tabs}
            decoration="underline"
          />
          {currentTab === 'sections' && (
            <CardModuleSectionList webCardKey={webCard} />
          )}
          {currentTab === 'templates' && (
            <CardTemplatesList webCard={webCard} />
          )} */}
      </SafeAreaView>
    </Container>
  );
};

const styles = StyleSheet.create({
  headerSubtitle: { color: colors.grey400 },
  headerTitle: { flexDirection: 'column', alignItems: 'center' },
});

export default relayScreen(AddModuleSectionScreen, {
  query: addModuleSectionScreenQuery,
  getVariables: (_, webCardId) => ({ webCardId: webCardId?.webCardId ?? '' }),
  getScreenOptions: () => ({
    stackAnimation: 'slide_from_bottom',
  }),
});
