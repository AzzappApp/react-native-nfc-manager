import { graphql, usePreloadedQuery } from 'react-relay';
import CarouselEditionScreen from '#screens/CarouselEditionScreen';
import type { CarouselEditionMobileScreenQuery } from '@azzapp/relay/artifacts/CarouselEditionMobileScreenQuery.graphql';
import type { CarouselEditionScreen_module$key } from '@azzapp/relay/artifacts/CarouselEditionScreen_module.graphql';
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
  const data = usePreloadedQuery(CarouselQuery, preloadedQuery);

  let module: CarouselEditionScreen_module$key | null = null;
  if (moduleId != null) {
    module =
      data.viewer.profile?.webCard.cardModules.find(
        module => module?.id === moduleId,
      ) ?? null;
    if (!module) {
      // TODO
    }
  }

  return <CarouselEditionScreen module={module} viewer={data.viewer} />;
};

const CarouselQuery = graphql`
  query CarouselEditionMobileScreenQuery {
    viewer {
      ...CarouselEditionScreen_viewer
      profile {
        webCard {
          cardModules {
            id
            kind
            ...CarouselEditionScreen_module
          }
        }
      }
    }
  }
`;

export default CarouselEditionMobileScreen;
