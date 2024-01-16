import { graphql, usePreloadedQuery } from 'react-relay';
import { MODULE_KIND_HORIZONTAL_PHOTO } from '@azzapp/shared/cardModuleHelpers';
import HorizontalPhotoEditionScreen from '#screens/HorizontalPhotoEditionScreen';
import type { HorizontalPhotoEditionMobileScreenQuery } from '#relayArtifacts/HorizontalPhotoEditionMobileScreenQuery.graphql';
import type { HorizontalPhotoEditionScreen_module$key } from '#relayArtifacts/HorizontalPhotoEditionScreen_module.graphql';
import type { PreloadedQuery } from 'react-relay';

type HorizontalPhotoEditionMobileScreenProps = {
  /**
   * The id of the module to edit
   */
  moduleId?: string;
  /**
   * The preloaded query for the screen
   */
  preloadedQuery: PreloadedQuery<HorizontalPhotoEditionMobileScreenQuery>;
};

/**
 * Mobile specific screen for the HorizontalPhoto edition
 * (In case of future web support)
 */
const HorizontalPhotoEditionMobileScreen = ({
  moduleId,
  preloadedQuery,
}: HorizontalPhotoEditionMobileScreenProps) => {
  const data = usePreloadedQuery(HorizontalPhotoQuery, preloadedQuery);

  let module: HorizontalPhotoEditionScreen_module$key | null = null;
  if (moduleId != null) {
    module =
      data.viewer.profile?.webCard.cardModules.find(
        module =>
          module?.id === moduleId &&
          module?.kind === MODULE_KIND_HORIZONTAL_PHOTO,
      ) ?? null;
    if (!module) {
      // TODO
    }
  }

  return <HorizontalPhotoEditionScreen module={module} viewer={data.viewer} />;
};

const HorizontalPhotoQuery = graphql`
  query HorizontalPhotoEditionMobileScreenQuery {
    viewer {
      ...HorizontalPhotoEditionScreen_viewer
      profile {
        webCard {
          cardModules {
            id
            kind
            ...HorizontalPhotoEditionScreen_module
          }
        }
      }
    }
  }
`;

export default HorizontalPhotoEditionMobileScreen;
