import { graphql, usePreloadedQuery } from 'react-relay';
import CarouselEditionScreen from '#screens/CarouselEditionScreen';
import type { CarouselEditionMobileScreenQuery } from '#relayArtifacts/CarouselEditionMobileScreenQuery.graphql';
import type { CarouselEditionScreen_module$key } from '#relayArtifacts/CarouselEditionScreen_module.graphql';
import type { PreloadedQuery } from 'react-relay';

type CarouselEditionMobileScreenProps = {
  /**
   * The id of the module to edit
   */
  moduleId?: string;
  /**
   * The preloaded query for the screen
   */
  preloadedQuery: PreloadedQuery<CarouselEditionMobileScreenQuery>;
};

/**
 * Mobile specific screen for the carousel edition
 * (In case of future web support)
 */
const CarouselEditionMobileScreen = ({
  moduleId,
  preloadedQuery,
}: CarouselEditionMobileScreenProps) => {
  const { node } = usePreloadedQuery(CarouselQuery, preloadedQuery);
  const profile = node?.profile;
  if (!profile) {
    return null;
  }

  let module: CarouselEditionScreen_module$key | null = null;
  if (moduleId != null) {
    module =
      profile?.webCard?.cardModules.find(module => module?.id === moduleId)
        ?.carouselModule ?? null;
    if (!module) {
      // TODO
    }
  }

  return <CarouselEditionScreen module={module} profile={profile} />;
};

const CarouselQuery = graphql`
  query CarouselEditionMobileScreenQuery($profileId: ID!) {
    node(id: $profileId) {
      ... on Profile @alias(as: "profile") {
        ...CarouselEditionScreen_profile
        webCard {
          cardModules {
            id
            kind
            ...CarouselEditionScreen_module @alias(as: "carouselModule")
          }
        }
      }
    }
  }
`;

export default CarouselEditionMobileScreen;
