import { CancelHeaderButton } from '#components/commonsButtons';
import { useRouter } from '#components/NativeRouter';
import relayScreen from '#helpers/relayScreen';
import BlockTextEditionMobileScreenNode from '#relayArtifacts/BlockTextEditionMobileScreenQuery.graphql';
import CarouselEditionMobileScreenQueryNode from '#relayArtifacts/CarouselEditionMobileScreenQuery.graphql';
import HorizontalPhotoEditionMobileScreenNode from '#relayArtifacts/HorizontalPhotoEditionMobileScreenQuery.graphql';
import LineDividerEditionMobileScreenNode from '#relayArtifacts/LineDividerEditionMobileScreenQuery.graphql';
import PhotoWithTextAndTitleEditionMobileScreenNode from '#relayArtifacts/PhotoWithTextAndTitleEditionMobileScreenQuery.graphql';
import SimpleButtonEditionMobileScreenNode from '#relayArtifacts/SimpleButtonEditionMobileScreenQuery.graphql';
import SimpleTextEditionMobileScreenNode from '#relayArtifacts/SimpleTextEditionMobileScreenQuery.graphql';
import SocialLinksEditionMobileScreenNode from '#relayArtifacts/SocialLinksEditionMobileScreenQuery.graphql';
import LoadingScreen from '#screens/LoadingScreen';
import Container from '#ui/Container';
import Header from '#ui/Header';
import SafeAreaView from '#ui/SafeAreaView';
import BlockTextEditionMobileScreen from './BlockTextEditionMobileScreen';
import CarouselEditionMobileScreen from './CarouselEditionMobileScreen';
import HorizontalPhotoEditionMobileScreen from './HorizontalPhotoEditionMobileScreen';
import LineDividerEditionMobileScreen from './LineDividerEditionMobileScreen';
import PhotoWithTextAndTitleEditionMobileScreen from './PhotoWithTextAndTitleEditionMobileScreen';
import SimpleButtonEditionMobileScreen from './SimpleButtonEditionMobileScreen';
import SimpleTextEditionMobileScreen from './SimpleTextEditionMobileScreen';
import SocialLinksEditionMobileScreen from './SocialLinksEditionMobileScreen';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { BlockTextEditionMobileScreenQuery } from '#relayArtifacts/BlockTextEditionMobileScreenQuery.graphql';
import type { CarouselEditionMobileScreenQuery } from '#relayArtifacts/CarouselEditionMobileScreenQuery.graphql';
import type { HorizontalPhotoEditionMobileScreenQuery } from '#relayArtifacts/HorizontalPhotoEditionMobileScreenQuery.graphql';
import type { LineDividerEditionMobileScreenQuery } from '#relayArtifacts/LineDividerEditionMobileScreenQuery.graphql';
import type { PhotoWithTextAndTitleEditionMobileScreenQuery } from '#relayArtifacts/PhotoWithTextAndTitleEditionMobileScreenQuery.graphql';
import type { SimpleButtonEditionMobileScreenQuery } from '#relayArtifacts/SimpleButtonEditionMobileScreenQuery.graphql';
import type { SimpleTextEditionMobileScreenQuery } from '#relayArtifacts/SimpleTextEditionMobileScreenQuery.graphql';
import type { SocialLinksEditionMobileScreenQuery } from '#relayArtifacts/SocialLinksEditionMobileScreenQuery.graphql';
import type { CardModuleEditionRoute } from '#routes';

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

/**
 * Fallback screen for the card module edition screen
 * While most of the time the screen will be preloaded, it can happen that
 * on slow network the screen is not preloaded and we need to display a fallback
 * That at least display a header that allow to go back to the previous screen
 */
const CardModuleEditionScreenFallback = () => {
  const router = useRouter();
  const onCancel = () => {
    router.back();
  };
  return (
    <Container style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <Header leftElement={<CancelHeaderButton onPress={onCancel} />} />
        <LoadingScreen />
      </SafeAreaView>
    </Container>
  );
};

export default relayScreen(CardModuleEditionScreen, {
  query: getQuery,
  getVariables: (_, profileInfos) => ({
    profileId: profileInfos?.profileId ?? '',
  }),
  fallback: CardModuleEditionScreenFallback,
});
