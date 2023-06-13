import { fetchQuery, graphql, usePreloadedQuery } from 'react-relay';
import { MODULE_KIND_SOCIAL_LINKS } from '@azzapp/shared/cardModuleHelpers';
import { getRelayEnvironment } from '#helpers/relayEnvironment';
import SocialLinksEditionScreen from '#screens/SocialLinksEditionScreen';
import type { SocialLinksEditionMobileScreenQuery } from '@azzapp/relay/artifacts/SocialLinksEditionMobileScreenQuery.graphql';
import type { SocialLinksEditionScreen_module$key } from '@azzapp/relay/artifacts/SocialLinksEditionScreen_module.graphql';
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
  const data = usePreloadedQuery(SocialLinksQuery, preloadedQuery);

  let module: SocialLinksEditionScreen_module$key | null = null;
  if (moduleId != null) {
    module =
      data.viewer.profile?.card?.modules.find(
        module =>
          module?.id === moduleId && module?.kind === MODULE_KIND_SOCIAL_LINKS,
      ) ?? null;
    if (!module) {
      // TODO
    }
  }

  return <SocialLinksEditionScreen module={module} viewer={data.viewer} />;
};

const SocialLinksQuery = graphql`
  query SocialLinksEditionMobileScreenQuery {
    viewer {
      ...SocialLinksEditionScreen_viewer
      profile {
        card {
          modules {
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

SocialLinksEditionMobileScreen.prefetch = () =>
  fetchQuery(getRelayEnvironment(), SocialLinksQuery, {});
