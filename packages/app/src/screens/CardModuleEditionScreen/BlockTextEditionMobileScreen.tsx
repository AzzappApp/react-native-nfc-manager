import { graphql, usePreloadedQuery } from 'react-relay';
import { MODULE_KIND_BLOCK_TEXT } from '@azzapp/shared/cardModuleHelpers';
import BlockTextEditionScreen from '#screens/BlockTextEditionScreen';
import type { BlockTextEditionMobileScreenQuery } from '#relayArtifacts/BlockTextEditionMobileScreenQuery.graphql';
import type { BlockTextEditionScreen_module$key } from '#relayArtifacts/BlockTextEditionScreen_module.graphql';
import type { PreloadedQuery } from 'react-relay';

type BlockTextEditionMobileScreenProps = {
  /**
   * The id of the module to edit
   */
  moduleId?: string;
  /**
   * The preloaded query for the screen
   */
  preloadedQuery: PreloadedQuery<BlockTextEditionMobileScreenQuery>;
};

/**
 * Mobile specific screen for the BlockText edition
 * (In case of future web support)
 */
const BlockTextEditionMobileScreen = ({
  moduleId,
  preloadedQuery,
}: BlockTextEditionMobileScreenProps) => {
  const { profile } = usePreloadedQuery(BlockTextQuery, preloadedQuery);
  if (!profile) {
    return null;
  }

  let module: BlockTextEditionScreen_module$key | null = null;
  if (moduleId != null) {
    module =
      profile?.webCard?.cardModules.find(
        module =>
          module?.id === moduleId && module?.kind === MODULE_KIND_BLOCK_TEXT,
      ) ?? null;
    if (!module) {
      // TODO
    }
  }

  return <BlockTextEditionScreen module={module} profile={profile} />;
};

const BlockTextQuery = graphql`
  query BlockTextEditionMobileScreenQuery($profileId: ID!) {
    profile: node(id: $profileId) {
      ... on Profile {
        ...BlockTextEditionScreen_profile
        webCard {
          cardModules {
            id
            kind
            ...BlockTextEditionScreen_module
          }
        }
      }
    }
  }
`;

export default BlockTextEditionMobileScreen;
