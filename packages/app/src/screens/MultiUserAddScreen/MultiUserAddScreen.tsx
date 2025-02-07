import { useCallback, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { Alert, StyleSheet, View } from 'react-native';
import { graphql, useFragment, usePreloadedQuery } from 'react-relay';
import { useRouter } from '#components/NativeRouter';
import { getAuthState } from '#helpers/authStore';
import relayScreen from '#helpers/relayScreen';
import Container from '#ui/Container';
import Header from '#ui/Header';
import HeaderButton from '#ui/HeaderButton';
import IconButton from '#ui/IconButton';
import SafeAreaView from '#ui/SafeAreaView';
import SearchBarStatic from '#ui/SearchBarStatic';
import MultiUserAddList from './MultiUserAddList';
import MultiUserAddModal from './MultiUserAddModal';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { MultiUserAddScreen_webCard$key } from '#relayArtifacts/MultiUserAddScreen_webCard.graphql';
import type { MultiUserAddScreenQuery } from '#relayArtifacts/MultiUserAddScreenQuery.graphql';
import type { MultiUserAddRoute } from '#routes';
import type { MultiUserAddModalActions } from './MultiUserAddModal';
import type * as Contacts from 'expo-contacts';

const multiUserAddScreenQuery = graphql`
  query MultiUserAddScreenQuery($webCardId: ID!) {
    webCard: node(id: $webCardId) {
      ...MultiUserAddModal_webCard
      ...MultiUserAddScreen_webCard
    }
  }
`;

const MultiUserAddScreen = ({
  preloadedQuery,
}: RelayScreenProps<MultiUserAddRoute, MultiUserAddScreenQuery>) => {
  const intl = useIntl();
  const router = useRouter();

  const [searchValue, setSearchValue] = useState<string | undefined>('');

  const { webCard } = usePreloadedQuery(
    multiUserAddScreenQuery,
    preloadedQuery,
  );

  const webCardData = useFragment(
    graphql`
      fragment MultiUserAddScreen_webCard on WebCard {
        id
        subscription {
          issuer
          availableSeats
        }
      }
    `,
    webCard as MultiUserAddScreen_webCard$key,
  );

  const ref = useRef<MultiUserAddModalActions>(null);

  const onAddUser = useCallback(
    (contact?: Contacts.Contact) => {
      if (
        webCardData?.subscription?.issuer &&
        webCardData.subscription.issuer !== 'web' &&
        webCardData?.subscription?.availableSeats <= 0
      ) {
        const { profileInfos } = getAuthState();

        if (profileInfos?.profileRole === 'owner') {
          Alert.alert(
            intl.formatMessage({
              defaultMessage: 'Not enough seats',
              description:
                'MultiUserAddScreen - Alert message title when not enough seats',
            }),
            intl.formatMessage({
              defaultMessage:
                "You don't have enough seat to invite more users. Please upgrade your subscription",
              description:
                'MultiUserAddScreen - Alert message content when not enough seats',
            }),
            [
              {
                text: intl.formatMessage({
                  defaultMessage: 'Cancel',
                  description:
                    'Alert button to cancel upgrading a subscription to add a new user',
                }),
                style: 'cancel',
                onPress: () => {
                  router.back();
                },
              },
              {
                text: intl.formatMessage({
                  defaultMessage: 'Upgrade',
                  description: 'MultiUserAddScreen - Upgrade bouton action',
                }),
                onPress: () => {
                  router.push({ route: 'USER_PAY_WALL' });
                },
              },
            ],
          );
        } else {
          ref.current?.open(contact ?? searchValue ?? '');
        }
      } else {
        Alert.alert(
          intl.formatMessage({
            defaultMessage: 'Not enough seats',
            description:
              'MultiUserAddScreen - Alert message title when not enough seats',
          }),
          intl.formatMessage({
            defaultMessage:
              "The owner doesn't have enough seat to invite more users. Please contact the owner to upgrade the subscription",
            description:
              'MultiUserAddScreen - Alert message content when not enough seats for the owner',
          }),
          [
            {
              text: intl.formatMessage({
                defaultMessage: 'Cancel',
                description:
                  'Alert button to cancel inviting a new user when the owner does not have enough seats',
              }),
              style: 'cancel',
              onPress: () => {
                router.back();
              },
            },
          ],
        );
      }
    },
    [
      intl,
      router,
      searchValue,
      webCardData.subscription?.availableSeats,
      webCardData.subscription?.issuer,
    ],
  );

  return (
    <>
      <Container style={{ flex: 1 }}>
        <SafeAreaView style={styles.container}>
          <Header
            middleElement={intl.formatMessage({
              defaultMessage: 'Add a user',
              description: 'MultiUserAddScreen - title',
            })}
            leftElement={
              <IconButton
                icon="arrow_left"
                onPress={router.back}
                iconSize={28}
                variant="icon"
              />
            }
            rightElement={
              <HeaderButton
                onPress={() => onAddUser()}
                label={intl.formatMessage({
                  defaultMessage: 'New',
                  description: 'New button label in Multi user add user title',
                })}
              />
            }
          />
          <View style={styles.search}>
            <SearchBarStatic
              onChangeText={setSearchValue}
              value={searchValue}
              placeholder={intl.formatMessage({
                defaultMessage: 'Search or enter email/phone number',
                description: 'Search Label for MultiUserAddScreen',
              })}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <MultiUserAddList
            onAddSingleUser={onAddUser}
            searchValue={searchValue}
          />
        </SafeAreaView>
      </Container>
      {webCard ? (
        <MultiUserAddModal
          onCompleted={router.back}
          webCard={webCard}
          beforeClose={() => setSearchValue('')}
          ref={ref}
        />
      ) : null}
    </>
  );
};

const styles = StyleSheet.create({
  search: { paddingHorizontal: 10 },
  container: { flex: 1, gap: 10 },
});

export default relayScreen(MultiUserAddScreen, {
  query: multiUserAddScreenQuery,
  getVariables: (_, profileInfos) => ({
    webCardId: profileInfos?.webCardId ?? '',
  }),
});
