import { useCallback, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { graphql, usePreloadedQuery } from 'react-relay';
import { useRouter } from '#components/NativeRouter';
import relayScreen from '#helpers/relayScreen';
import Container from '#ui/Container';
import Header from '#ui/Header';
import HeaderButton from '#ui/HeaderButton';
import IconButton from '#ui/IconButton';
import SearchBarStatic from '#ui/SearchBarStatic';
import MultiUserAddList from './MultiUserAddList';
import MultiUserAddModal from './MultiUserAddModal';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { MultiUserAddScreenQuery } from '#relayArtifacts/MultiUserAddScreenQuery.graphql';
import type { MultiUserAddRoute } from '#routes';
import type { MultiUserAddModalActions } from './MultiUserAddModal';
import type * as Contacts from 'expo-contacts';

const multiUserAddScreenQuery = graphql`
  query MultiUserAddScreenQuery {
    viewer {
      profile {
        webCard {
          ...MultiUserAddModal_webCard
        }
      }
    }
  }
`;

const MultiUserAddScreen = ({
  preloadedQuery,
}: RelayScreenProps<MultiUserAddRoute, MultiUserAddScreenQuery>) => {
  const intl = useIntl();
  const router = useRouter();

  const [searchValue, setSearchValue] = useState<string | undefined>('');

  const data = usePreloadedQuery(multiUserAddScreenQuery, preloadedQuery);

  const ref = useRef<MultiUserAddModalActions>(null);

  const onAddSingleUser = (contact: Contacts.Contact) => {
    ref.current?.open(contact);
  };

  const addNewUser = useCallback(() => {
    ref.current?.open();
  }, []);

  return (
    <>
      <Container style={{ flex: 1 }}>
        <SafeAreaView
          style={{ flex: 1 }}
          edges={{ bottom: 'off', top: 'additive' }}
        >
          <Header
            middleElement={intl.formatMessage({
              defaultMessage: 'Add a user',
              description: 'MultiUserAddScreen - title',
            })}
            style={styles.header}
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
                onPress={addNewUser}
                label={intl.formatMessage({
                  defaultMessage: 'New',
                  description: 'New button label in Multi user add user title',
                })}
              />
            }
          />
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
          <MultiUserAddList
            onAddSingleUser={onAddSingleUser}
            searchValue={searchValue}
          />
        </SafeAreaView>
      </Container>
      {data.viewer.profile ? (
        <MultiUserAddModal
          onCompleted={router.back}
          webCard={data.viewer.profile.webCard}
          beforeClose={() => setSearchValue('')}
          ref={ref}
        />
      ) : null}
    </>
  );
};

const styles = StyleSheet.create({
  header: { marginBottom: 10 },
});

export default relayScreen(MultiUserAddScreen, {
  query: multiUserAddScreenQuery,
});
