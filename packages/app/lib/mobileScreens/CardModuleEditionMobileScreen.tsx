import { graphql, usePreloadedQuery } from 'react-relay';
import relayScreen from '../helpers/relayScreen';
import CoverEditionScreen from '../screens/CoverEditionScreen';
import type { RelayScreenProps } from '../helpers/relayScreen';
import type { CardModuleEditionRoute } from '../routes';
import type { CardModuleEditionMobileScreenQuery } from '@azzapp/relay/artifacts/CardModuleEditionMobileScreenQuery.graphql';

const CardModuleEditionMobileScreen = ({
  preloadedQuery,
}: RelayScreenProps<
  CardModuleEditionRoute,
  CardModuleEditionMobileScreenQuery
>) => {
  const data = usePreloadedQuery(
    cardModuleEditionMobileScreenQuery,
    preloadedQuery,
  );
  if (!data.viewer) {
    return null;
  }
  return <CoverEditionScreen viewer={data.viewer} />;
};

const cardModuleEditionMobileScreenQuery = graphql`
  query CardModuleEditionMobileScreenQuery {
    viewer {
      ...CoverEditionScreen_viewer
    }
  }
`;

export default relayScreen(CardModuleEditionMobileScreen, {
  query: cardModuleEditionMobileScreenQuery,
});
