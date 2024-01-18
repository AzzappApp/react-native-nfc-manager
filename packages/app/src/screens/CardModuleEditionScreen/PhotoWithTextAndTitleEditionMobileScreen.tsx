import { graphql, usePreloadedQuery } from 'react-relay';
import { MODULE_KIND_PHOTO_WITH_TEXT_AND_TITLE } from '@azzapp/shared/cardModuleHelpers';
import PhotoWithTextAndTitleEditionScreen from '#screens/PhotoWithTextAndTitleEditionScreen';
import type { PhotoWithTextAndTitleEditionMobileScreenQuery } from '#relayArtifacts/PhotoWithTextAndTitleEditionMobileScreenQuery.graphql';
import type { PhotoWithTextAndTitleEditionScreen_module$key } from '#relayArtifacts/PhotoWithTextAndTitleEditionScreen_module.graphql';
import type { PreloadedQuery } from 'react-relay';

type PhotoWithTextAndTitleEditionMobileScreenProps = {
  /**
   * The id of the module to edit
   */
  moduleId?: string;
  /**
   * The preloaded query for the screen
   */
  preloadedQuery: PreloadedQuery<PhotoWithTextAndTitleEditionMobileScreenQuery>;
};

/**
 * Mobile specific screen for the PhotoWithTextAndTitle edition
 * (In case of future web support)
 */
const PhotoWithTextAndTitleEditionMobileScreen = ({
  moduleId,
  preloadedQuery,
}: PhotoWithTextAndTitleEditionMobileScreenProps) => {
  const { profile } = usePreloadedQuery(
    PhotoWithTextAndTitleQuery,
    preloadedQuery,
  );

  if (!profile) {
    return null;
  }

  let module: PhotoWithTextAndTitleEditionScreen_module$key | null = null;
  if (moduleId != null) {
    module =
      profile?.webCard?.cardModules.find(
        module =>
          module?.id === moduleId &&
          module?.kind === MODULE_KIND_PHOTO_WITH_TEXT_AND_TITLE,
      ) ?? null;
    if (!module) {
      // TODO
    }
  }

  return (
    <PhotoWithTextAndTitleEditionScreen module={module} profile={profile} />
  );
};

const PhotoWithTextAndTitleQuery = graphql`
  query PhotoWithTextAndTitleEditionMobileScreenQuery($profileId: ID!) {
    profile: node(id: $profileId) {
      ... on Profile {
        ...PhotoWithTextAndTitleEditionScreen_profile
        webCard {
          cardModules {
            id
            kind
            ...PhotoWithTextAndTitleEditionScreen_module
          }
        }
      }
    }
  }
`;

export default PhotoWithTextAndTitleEditionMobileScreen;
