import CoverEditionMobileScreenQueryNode from '@azzapp/relay/artifacts/CoverEditionMobileScreenQuery.graphql';
import SimpleTextEditionMobileScreenNode from '@azzapp/relay/artifacts/SimpleTextEditionMobileScreenQuery.graphql';
import relayScreen from '#helpers/relayScreen';
import CoverEditionMobileScreen from './CoverEditionMobileScreen';
import SimpleTextEditionMobileScreen from './SimpleTextEditionMobileScreen';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { CardModuleEditionRoute } from '#routes';
import type { CoverEditionMobileScreenQuery } from '@azzapp/relay/artifacts/CoverEditionMobileScreenQuery.graphql';
import type { SimpleTextEditionMobileScreenQuery } from '@azzapp/relay/artifacts/SimpleTextEditionMobileScreenQuery.graphql';

/**
 * Display the edition screen for a card module or the card cover
 * Depending on the route params
 */
const CardModuleEditionMobileScreen = ({
  preloadedQuery,
  route: { params },
}: RelayScreenProps<
  CardModuleEditionRoute,
  CoverEditionMobileScreenQuery | SimpleTextEditionMobileScreenQuery
>) => {
  switch (params?.module) {
    case 'cover':
      return (
        <CoverEditionMobileScreen
          preloadedQuery={preloadedQuery as any}
          isCreation={params.isNew}
        />
      );
    case 'simpleText':
    case 'simpleTitle':
      return (
        <SimpleTextEditionMobileScreen
          moduleId={params.moduleId}
          preloadedQuery={preloadedQuery as any}
          moduleKind={params.module}
        />
      );
    default:
      return null;
  }
};

CardModuleEditionMobileScreen.prefetch = ({
  params,
}: CardModuleEditionRoute) => {
  switch (params?.module) {
    case 'cover':
      return CoverEditionMobileScreen.prefetch();
    case 'simpleText':
    case 'simpleTitle':
      return SimpleTextEditionMobileScreen.prefetch();
    default:
      return null;
  }
};

const getQuery = (params: CardModuleEditionRoute['params']) => {
  switch (params.module) {
    case 'cover':
      return CoverEditionMobileScreenQueryNode;
    case 'simpleText':
    case 'simpleTitle':
      return SimpleTextEditionMobileScreenNode;
    default:
      // for type safety
      return CoverEditionMobileScreenQueryNode;
  }
};

export default relayScreen(CardModuleEditionMobileScreen, {
  query: getQuery,
});
