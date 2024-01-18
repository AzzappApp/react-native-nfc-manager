import { graphql, usePreloadedQuery } from 'react-relay';
import { MODULE_KIND_SOCIAL_LINKS } from '@azzapp/shared/cardModuleHelpers';
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
  const { profile } = usePreloadedQuery(SocialLinksQuery, preloadedQuery);
  let module: SocialLinksEditionScreen_module$key | null = null;
  if (!profile) {
    return null;
  }

  if (moduleId != null) {
    module =
      profile.webCard?.cardModules.find(
        module =>
          module?.id === moduleId && module?.kind === MODULE_KIND_SOCIAL_LINKS,
      ) ?? null;
    if (!module) {
      // TODO
    }
  }

  return <SocialLinksEditionScreen module={module} profile={profile} />;
};

const SocialLinksQuery = graphql`
  query SocialLinksEditionMobileScreenQuery($profileId: ID!) {
    profile: node(id: $profileId) {
      ... on Profile {
        ...SocialLinksEditionScreen_profile
        webCard {
          cardModules {
            id
            kind
            ...SocialLinksEditionScreen_module
          }
        }
      }
    }
  }
`;

export default SocialLinksEditionMobileScreen;
