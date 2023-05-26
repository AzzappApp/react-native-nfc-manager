import CarouselEditionMobileScreenQueryNode from '@azzapp/relay/artifacts/CarouselEditionMobileScreenQuery.graphql';
import CoverEditionMobileScreenQueryNode from '@azzapp/relay/artifacts/CoverEditionMobileScreenQuery.graphql';
import LineDividerEditionMobileScreenNode from '@azzapp/relay/artifacts/LineDividerEditionMobileScreenQuery.graphql';
import SimpleTextEditionMobileScreenNode from '@azzapp/relay/artifacts/SimpleTextEditionMobileScreenQuery.graphql';
import relayScreen from '#helpers/relayScreen';
import CarouselEditionMobileScreen from './CarouselEditionMobileScreen';
import CoverEditionMobileScreen from './CoverEditionMobileScreen';
import LineDividerEditionMobileScreen from './LineDividerEditionMobileScreen';
import SimpleTextEditionMobileScreen from './SimpleTextEditionMobileScreen';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { CardModuleEditionRoute } from '#routes';
import type { CarouselEditionMobileScreenQuery } from '@azzapp/relay/artifacts/CarouselEditionMobileScreenQuery.graphql';
import type { CoverEditionMobileScreenQuery } from '@azzapp/relay/artifacts/CoverEditionMobileScreenQuery.graphql';
import type { LineDividerEditionMobileScreenQuery } from '@azzapp/relay/artifacts/LineDividerEditionMobileScreenQuery.graphql';
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
  | CarouselEditionMobileScreenQuery
  | CoverEditionMobileScreenQuery
  | LineDividerEditionMobileScreenQuery
  | SimpleTextEditionMobileScreenQuery
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
    case 'lineDivider':
      return (
        <LineDividerEditionMobileScreen
          moduleId={params.moduleId}
          preloadedQuery={preloadedQuery as any}
        />
      );
    case 'carousel':
      return (
        <CarouselEditionMobileScreen
          moduleId={params.moduleId}
          preloadedQuery={preloadedQuery as any}
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
    case 'lineDivider':
      return LineDividerEditionMobileScreen.prefetch();
    case 'carousel':
      return CarouselEditionMobileScreen.prefetch();
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
    case 'lineDivider':
      return LineDividerEditionMobileScreenNode;
    case 'carousel':
      return CarouselEditionMobileScreenQueryNode;
    default:
      // for type safety
      return CoverEditionMobileScreenQueryNode;
  }
};

export default relayScreen(CardModuleEditionMobileScreen, {
  query: getQuery,
});
