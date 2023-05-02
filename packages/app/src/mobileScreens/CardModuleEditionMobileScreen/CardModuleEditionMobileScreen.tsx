import CoverEditionMobileScreenQueryNode from '@azzapp/relay/artifacts/CoverEditionMobileScreenQuery.graphql';
import relayScreen from '#helpers/relayScreen';
import CoverEditionMobileScreen from './CoverEditionMobileScreen';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { CardModuleEditionRoute } from '#routes';
import type { CoverEditionMobileScreenQuery } from '@azzapp/relay/artifacts/CoverEditionMobileScreenQuery.graphql';

const CardModuleEditionMobileScreen = ({
  preloadedQuery,
  route: { params },
}: RelayScreenProps<CardModuleEditionRoute, CoverEditionMobileScreenQuery>) => {
  switch (params?.module) {
    case 'cover': {
      return (
        <CoverEditionMobileScreen
          preloadedQuery={preloadedQuery}
          isCreation={params.isCreation}
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
      return CoverEditionMobileScreenQueryNode;
  }
};

export default relayScreen(CardModuleEditionMobileScreen, {
  query: getQuery,
});
