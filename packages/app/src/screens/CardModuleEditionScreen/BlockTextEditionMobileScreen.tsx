import { graphql, usePreloadedQuery } from 'react-relay';
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
  const { node } = usePreloadedQuery(BlockTextQuery, preloadedQuery);
  const profile = node?.profile;
  if (!profile) {
    return null;
  }

  let module: BlockTextEditionScreen_module$key | null = null;
  if (moduleId != null) {
    module =
      profile?.webCard?.cardModules.find(module => module.id === moduleId)
        ?.blockTextModule ?? null;
    if (!module) {
      // TODO
    }
  }

  return <BlockTextEditionScreen module={module} profile={profile} />;
};

const BlockTextQuery = graphql`
  query BlockTextEditionMobileScreenQuery($profileId: ID!) {
    node(id: $profileId) {
      ... on Profile @alias(as: "profile") {
        ...BlockTextEditionScreen_profile
        webCard {
          cardModules {
            id
            ...BlockTextEditionScreen_module @alias(as: "blockTextModule")
          }
        }
      }
    }
  }
`;

export default BlockTextEditionMobileScreen;
