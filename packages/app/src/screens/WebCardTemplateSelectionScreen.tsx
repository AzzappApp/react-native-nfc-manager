import { Suspense, useCallback, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Toast from 'react-native-toast-message';
import { graphql, usePreloadedQuery } from 'react-relay';
import CardTemplateList from '#components/CardTemplateList';
import { ApplyHeaderButton } from '#components/commonsButtons';
import { useRouter } from '#components/NativeRouter';
import WebCardBuilderSubtitle from '#components/WebCardBuilderSubtitle';
import relayScreen from '#helpers/relayScreen';
import useLoadCardTemplateMutation from '#hooks/useLoadCardTemplateMutation';
import useScreenInsets from '#hooks/useScreenInsets';
import ActivityIndicator from '#ui/ActivityIndicator';
import Container from '#ui/Container';
import Text from '#ui/Text';
import WizardPagerHeader, { PAGER_HEADER_HEIGHT } from '#ui/WizardPagerHeader';
import type {
  CardTemplateItem,
  CardTemplateListHandle,
} from '#components/CardTemplateList';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { WebCardTemplateSelectionScreenQuery } from '#relayArtifacts/WebCardTemplateSelectionScreenQuery.graphql';
import type { WebCardTemplateSelectionRoute } from '#routes';

const query = graphql`
  query WebCardTemplateSelectionScreenQuery($profileId: ID!) {
    currentUser {
      isPremium
    }
    node(id: $profileId) {
      ... on Profile @alias(as: "profile") {
        id
        webCard {
          id
          userName
          webCardKind
          isMultiUser
          isPremium
        }
      }
    }
  }
`;

const WebCardTemplateSelectionScreen = ({
  preloadedQuery,
}: RelayScreenProps<
  WebCardTemplateSelectionRoute,
  WebCardTemplateSelectionScreenQuery
>) => {
  const data = usePreloadedQuery(query, preloadedQuery);
  const profile = data.node?.profile;
  const currentUser = data.currentUser;

  const [selectedTemplate, setSelectedTemplate] =
    useState<CardTemplateItem | null>(null);
  const [headerVisible, setHeaderVisible] = useState(true);

  const cardTemplateListRef = useRef<CardTemplateListHandle>(null);
  const router = useRouter();
  const onDone = useCallback(() => {
    if (!profile?.webCard?.userName) {
      return;
    }
    const {
      webCard: { id: webCardId, userName },
    } = profile;
    router.replace({
      route: 'WEBCARD',
      params: { webCardId, userName, editing: true },
    });
  }, [profile, router]);

  const onApply = useCallback(() => {
    cardTemplateListRef.current?.onSubmit();
  }, []);

  const hideHeader = useCallback(() => {
    setHeaderVisible(false);
  }, []);

  const showHeader = useCallback(() => {
    setHeaderVisible(true);
  }, []);

  const onSelectTemplate = useCallback((template: CardTemplateItem) => {
    setSelectedTemplate(template);
  }, []);

  const intl = useIntl();

  const [commit, inFlight] = useLoadCardTemplateMutation();
  const onSubmit = useCallback(
    (cardTemplate: CardTemplateItem) => {
      const webCardId = profile?.webCard?.id;
      if (!webCardId || !cardTemplate?.id) {
        return;
      }
      commit({
        variables: {
          cardTemplateId: cardTemplate.id,
          webCardId,
        },
        onCompleted: () => {
          onDone();
        },
        onError: error => {
          console.error(error);
          Toast.show({
            type: 'error',
            text1: intl.formatMessage({
              defaultMessage: 'Error, could not load the template',
              description: 'NewProfile - Card edition step error toast',
            }),
          });
        },
      });
    },
    [commit, intl, onDone, profile?.webCard?.id],
  );

  const insets = useScreenInsets();

  const { height: windowHeight } = useWindowDimensions();
  const editorHeight = windowHeight - insets.top - PAGER_HEADER_HEIGHT;

  return (
    <Container
      style={{
        flex: 1,
        paddingTop: insets.top,
      }}
    >
      {headerVisible && (
        <WizardPagerHeader
          backIcon="arrow_down"
          onBack={router.backToTop}
          title={
            <View style={styles.middleContainer}>
              <Text variant="large">
                <FormattedMessage
                  defaultMessage="Load a template"
                  description="WebCard creation screen title"
                />
              </Text>

              {selectedTemplate &&
                profile?.webCard &&
                !profile?.webCard.isPremium &&
                !currentUser?.isPremium && (
                  <WebCardBuilderSubtitle
                    modules={selectedTemplate.modules}
                    webCard={profile.webCard}
                  />
                )}
            </View>
          }
          rightElement={
            <ApplyHeaderButton
              style={styles.applyButton}
              onPress={onApply}
              disabled={inFlight}
            />
          }
          rightElementWidth={80}
          currentPage={4}
          nbPages={5}
        />
      )}
      <Suspense
        fallback={
          <View style={styles.activityIndicatorContainer}>
            <ActivityIndicator />
          </View>
        }
      >
        {profile && (
          <CardTemplateList
            profileId={profile.id}
            height={editorHeight}
            onSkip={onDone}
            onApplyTemplate={onSubmit}
            loading={inFlight}
            onPreviewModal={hideHeader}
            onPreviewModalClose={showHeader}
            ref={cardTemplateListRef}
            onSelectTemplate={onSelectTemplate}
          />
        )}
      </Suspense>
    </Container>
  );
};

export default relayScreen(WebCardTemplateSelectionScreen, {
  query,
  getVariables: (_, profileInfos) => ({
    profileId: profileInfos?.profileId ?? '',
  }),
});

const styles = StyleSheet.create({
  activityIndicatorContainer: {
    flex: 1,
    alignItems: 'center',
    marginTop: 200,
  },
  middleContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButton: { width: 70, marginRight: 10 },
});
