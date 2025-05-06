import { graphql, usePreloadedQuery } from 'react-relay';
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
  const { node } = usePreloadedQuery(HorizontalPhotoQuery, preloadedQuery);
  const profile = node?.profile;
  if (!profile) {
    return null;
  }

  let module: HorizontalPhotoEditionScreen_module$key | null = null;
  if (moduleId != null) {
    module =
      profile?.webCard?.cardModules.find(module => module?.id === moduleId)
        ?.horizontalPhotoModule ?? null;
    if (!module) {
      // TODO
    }
  }

  return <HorizontalPhotoEditionScreen module={module} profile={profile} />;
};

const HorizontalPhotoQuery = graphql`
  query HorizontalPhotoEditionMobileScreenQuery($profileId: ID!) {
    node(id: $profileId) {
      ... on Profile @alias(as: "profile") {
        ...HorizontalPhotoEditionScreen_profile
        webCard {
          cardModules {
            id
            kind
            ...HorizontalPhotoEditionScreen_module
              @alias(as: "horizontalPhotoModule")
          }
        }
      }
    }
  }
`;

export default HorizontalPhotoEditionMobileScreen;
