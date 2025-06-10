import { graphql, usePreloadedQuery } from 'react-relay';
import SocialLinksEditionScreen from '#screens/SocialLinksEditionScreen';
import type { SocialLinksEditionMobileScreenQuery } from '#relayArtifacts/SocialLinksEditionMobileScreenQuery.graphql';
import type { SocialLinksEditionScreen_module$key } from '#relayArtifacts/SocialLinksEditionScreen_module.graphql';
import type { PreloadedQuery } from 'react-relay';

type SocialLinksEditionMobileScreenProps = {
  /**
   * The id of the module to edit
   */
  moduleId?: string;
  /**
   * The preloaded query for the screen
   */
  preloadedQuery: PreloadedQuery<SocialLinksEditionMobileScreenQuery>;
};

/**
 * Mobile specific screen for the SocialLinks edition
 * (In case of future web support)
 */
const SocialLinksEditionMobileScreen = ({
  moduleId,
  preloadedQuery,
}: SocialLinksEditionMobileScreenProps) => {
  const { node } = usePreloadedQuery(SocialLinksQuery, preloadedQuery);
  const profile = node?.profile;
  let module: SocialLinksEditionScreen_module$key | null = null;
  if (!profile) {
    return null;
  }

  if (moduleId != null) {
    module =
      profile.webCard?.cardModules.find(module => module?.id === moduleId)
        ?.socialLinksModule ?? null;
    if (!module) {
      // TODO
    }
  }

  return <SocialLinksEditionScreen module={module} profile={profile} />;
};

const SocialLinksQuery = graphql`
  query SocialLinksEditionMobileScreenQuery($profileId: ID!) {
    node(id: $profileId) {
      ... on Profile @alias(as: "profile") {
        ...SocialLinksEditionScreen_profile
        webCard {
          cardModules {
            id
            ...SocialLinksEditionScreen_module @alias(as: "socialLinksModule")
          }
        }
      }
    }
  }
`;

export default SocialLinksEditionMobileScreen;
