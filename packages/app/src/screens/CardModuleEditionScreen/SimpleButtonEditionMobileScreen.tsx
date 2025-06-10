import { graphql, usePreloadedQuery } from 'react-relay';
import SimpleButtonEditionScreen from '#screens/SimpleButtonEditionScreen';
import type { SimpleButtonEditionMobileScreenQuery } from '#relayArtifacts/SimpleButtonEditionMobileScreenQuery.graphql';
import type { SimpleButtonEditionScreen_module$key } from '#relayArtifacts/SimpleButtonEditionScreen_module.graphql';
import type { PreloadedQuery } from 'react-relay';

type SimpleButtonEditionMobileScreenProps = {
  /**
   * The id of the module to edit
   */
  moduleId?: string;
  /**
   * The preloaded query for the screen
   */
  preloadedQuery: PreloadedQuery<SimpleButtonEditionMobileScreenQuery>;
};

/**
 * Mobile specific screen for the SimpleButton edition
 * (In case of future web support)
 */
const SimpleButtonEditionMobileScreen = ({
  moduleId,
  preloadedQuery,
}: SimpleButtonEditionMobileScreenProps) => {
  const { node } = usePreloadedQuery(SimpleButtonQuery, preloadedQuery);
  let module: SimpleButtonEditionScreen_module$key | null = null;
  const profile = node?.profile;
  if (!profile) {
    return null;
  }
  if (moduleId != null) {
    module =
      profile?.webCard?.cardModules.find(module => module?.id === moduleId)
        ?.simpleButtonModule ?? null;
    if (!module) {
      // TODO
    }
  }

  return <SimpleButtonEditionScreen module={module} profile={profile} />;
};

const SimpleButtonQuery = graphql`
  query SimpleButtonEditionMobileScreenQuery($profileId: ID!) {
    node(id: $profileId) {
      ... on Profile @alias(as: "profile") {
        ...SimpleButtonEditionScreen_profile
        webCard {
          cardModules {
            id
            ...SimpleButtonEditionScreen_module @alias(as: "simpleButtonModule")
          }
        }
      }
    }
  }
`;

export default SimpleButtonEditionMobileScreen;
