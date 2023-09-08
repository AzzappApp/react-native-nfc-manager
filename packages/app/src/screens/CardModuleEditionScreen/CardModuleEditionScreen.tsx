import BlockTextEditionMobileScreenNode from '@azzapp/relay/artifacts/BlockTextEditionMobileScreenQuery.graphql';
import CarouselEditionMobileScreenQueryNode from '@azzapp/relay/artifacts/CarouselEditionMobileScreenQuery.graphql';
import HorizontalPhotoEditionMobileScreenNode from '@azzapp/relay/artifacts/HorizontalPhotoEditionMobileScreenQuery.graphql';
import LineDividerEditionMobileScreenNode from '@azzapp/relay/artifacts/LineDividerEditionMobileScreenQuery.graphql';
import PhotoWithTextAndTitleEditionMobileScreenNode from '@azzapp/relay/artifacts/PhotoWithTextAndTitleEditionMobileScreenQuery.graphql';
import SimpleButtonEditionMobileScreenNode from '@azzapp/relay/artifacts/SimpleButtonEditionMobileScreenQuery.graphql';
import SimpleTextEditionMobileScreenNode from '@azzapp/relay/artifacts/SimpleTextEditionMobileScreenQuery.graphql';
import SocialLinksEditionMobileScreenNode from '@azzapp/relay/artifacts/SocialLinksEditionMobileScreenQuery.graphql';
import relayScreen from '#helpers/relayScreen';
import BlockTextEditionMobileScreen from './BlockTextEditionMobileScreen';
import CarouselEditionMobileScreen from './CarouselEditionMobileScreen';
import HorizontalPhotoEditionMobileScreen from './HorizontalPhotoEditionMobileScreen';
import LineDividerEditionMobileScreen from './LineDividerEditionMobileScreen';
import PhotoWithTextAndTitleEditionMobileScreen from './PhotoWithTextAndTitleEditionMobileScreen';
import SimpleButtonEditionMobileScreen from './SimpleButtonEditionMobileScreen';
import SimpleTextEditionMobileScreen from './SimpleTextEditionMobileScreen';
import SocialLinksEditionMobileScreen from './SocialLinksEditionMobileScreen';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { CardModuleEditionRoute } from '#routes';
import type { BlockTextEditionMobileScreenQuery } from '@azzapp/relay/artifacts/BlockTextEditionMobileScreenQuery.graphql';
import type { CarouselEditionMobileScreenQuery } from '@azzapp/relay/artifacts/CarouselEditionMobileScreenQuery.graphql';
import type { HorizontalPhotoEditionMobileScreenQuery } from '@azzapp/relay/artifacts/HorizontalPhotoEditionMobileScreenQuery.graphql';
import type { LineDividerEditionMobileScreenQuery } from '@azzapp/relay/artifacts/LineDividerEditionMobileScreenQuery.graphql';
import type { PhotoWithTextAndTitleEditionMobileScreenQuery } from '@azzapp/relay/artifacts/PhotoWithTextAndTitleEditionMobileScreenQuery.graphql';
import type { SimpleButtonEditionMobileScreenQuery } from '@azzapp/relay/artifacts/SimpleButtonEditionMobileScreenQuery.graphql';
import type { SimpleTextEditionMobileScreenQuery } from '@azzapp/relay/artifacts/SimpleTextEditionMobileScreenQuery.graphql';
import type { SocialLinksEditionMobileScreenQuery } from '@azzapp/relay/artifacts/SocialLinksEditionMobileScreenQuery.graphql';

/**
 * Display the edition screen for a card module or the card cover
 * Depending on the route params
 */
const CardModuleEditionScreen = ({
  preloadedQuery,
  route: { params },
}: RelayScreenProps<
  CardModuleEditionRoute,
  | BlockTextEditionMobileScreenQuery
  | CarouselEditionMobileScreenQuery
  | HorizontalPhotoEditionMobileScreenQuery
  | LineDividerEditionMobileScreenQuery
  | PhotoWithTextAndTitleEditionMobileScreenQuery
  | SimpleButtonEditionMobileScreenQuery
  | SimpleTextEditionMobileScreenQuery
  | SocialLinksEditionMobileScreenQuery
>) => {
  switch (params?.module) {
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
    case 'horizontalPhoto':
      return (
        <HorizontalPhotoEditionMobileScreen
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
    case 'simpleButton':
      return (
        <SimpleButtonEditionMobileScreen
          moduleId={params.moduleId}
          preloadedQuery={preloadedQuery as any}
        />
      );

    case 'photoWithTextAndTitle':
      return (
        <PhotoWithTextAndTitleEditionMobileScreen
          moduleId={params.moduleId}
          preloadedQuery={preloadedQuery as any}
        />
      );
    case 'socialLinks':
      return (
        <SocialLinksEditionMobileScreen
          moduleId={params.moduleId}
          preloadedQuery={preloadedQuery as any}
        />
      );
    case 'blockText':
      return (
        <BlockTextEditionMobileScreen
          moduleId={params.moduleId}
          preloadedQuery={preloadedQuery as any}
        />
      );
    default:
      return null;
  }
};

const getQuery = (params: CardModuleEditionRoute['params']) => {
  switch (params.module) {
    case 'simpleText':
    case 'simpleTitle':
      return SimpleTextEditionMobileScreenNode;
    case 'lineDivider':
      return LineDividerEditionMobileScreenNode;
    case 'horizontalPhoto':
      return HorizontalPhotoEditionMobileScreenNode;
    case 'carousel':
      return CarouselEditionMobileScreenQueryNode;
    case 'simpleButton':
      return SimpleButtonEditionMobileScreenNode;
    case 'photoWithTextAndTitle':
      return PhotoWithTextAndTitleEditionMobileScreenNode;
    case 'socialLinks':
      return SocialLinksEditionMobileScreenNode;
    case 'blockText':
      return BlockTextEditionMobileScreenNode;
    default:
      // for type safety
      return SimpleTextEditionMobileScreenNode;
  }
};

export default relayScreen(CardModuleEditionScreen, {
  query: getQuery,
});
