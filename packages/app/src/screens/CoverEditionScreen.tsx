import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import { graphql } from 'react-relay';
import {
  CancelHeaderButton,
  SaveHeaderButton,
} from '#components/commonsButtons';
import { useRouter } from '#components/NativeRouter';
import relayScreen from '#helpers/relayScreen';
import useScreenInsets from '#hooks/useScreenInsets';
import Container from '#ui/Container';
import Header from '#ui/Header';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { CoverEditionScreenQuery } from '#relayArtifacts/CoverEditionScreenQuery.graphql';
import type { CoverEditionRoute } from '#routes';

const CoverEditionScreen = ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  preloadedQuery,
}: RelayScreenProps<CoverEditionRoute, CoverEditionScreenQuery>) => {
  const intl = useIntl();
  const router = useRouter();

  const onSave = useCallback(() => {}, []);

  const onCancel = useCallback(() => {
    router.back();
  }, [router]);

  const insets = useScreenInsets();

  return (
    <Container
      style={{
        flex: 1,
        paddingTop: insets.top,
      }}
    >
      <Header
        middleElement={intl.formatMessage({
          defaultMessage: 'Edit your cover',
          description: 'CoverEditionScreen header title',
        })}
        leftElement={<CancelHeaderButton onPress={onCancel} />}
        rightElement={<SaveHeaderButton onPress={onSave} />}
      />
    </Container>
  );
};

const query = graphql`
  query CoverEditionScreenQuery($profileId: ID!) {
    node(id: $profileId) {
      id
    }
  }
`;

export default relayScreen(CoverEditionScreen, {
  query,
  getVariables: (_, profileInfos) => ({
    profileId: profileInfos?.profileId ?? '',
  }),
});
