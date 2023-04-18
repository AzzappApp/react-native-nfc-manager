import { graphql, usePreloadedQuery } from 'react-relay';
import relayScreen from '#helpers/relayScreen';
import CoverEditionScreen from '#screens/CoverEditionScreen';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { CardModuleEditionRoute } from '#routes';
import type { CardModuleEditionMobileScreenCoverQuery } from '@azzapp/relay/artifacts/CardModuleEditionMobileScreenCoverQuery.graphql';
import type { CoverEditionScreen_viewer$key } from '@azzapp/relay/artifacts/CoverEditionScreen_viewer.graphql';

const CardModuleEditionMobileScreen = ({
  preloadedQuery,
  route: { params },
}: RelayScreenProps<
  CardModuleEditionRoute,
  CardModuleEditionMobileScreenCoverQuery
>) => {
  const data = usePreloadedQuery(getQuery(params), preloadedQuery);
  if (!data.viewer) {
    return null;
  }

  switch (params.module) {
    case 'cover': {
      return (
        <CoverEditionScreen
          viewer={data.viewer as CoverEditionScreen_viewer$key}
        />
      );
    }
    default:
      return null;
  }
};

const getQuery = (params: CardModuleEditionRoute['params']) => {
  switch (params.module) {
    default:
      return graphql`
        query CardModuleEditionMobileScreenCoverQuery {
          viewer {
            ...CoverEditionScreen_viewer
          }
        }
      `;
  }
};

const getVariables = (params: CardModuleEditionRoute['params']) => {
  switch (params.module) {
    default:
      return {
        module: params.module,
      };
  }
};

export default relayScreen(CardModuleEditionMobileScreen, {
  query: getQuery,
  getVariables,
});
