import { fetchQuery, graphql, usePreloadedQuery } from 'react-relay';
import { MODULE_KIND_LINE_DIVIDER } from '@azzapp/shared/cardModuleHelpers';
import { getRelayEnvironment } from '#helpers/relayEnvironment';
import LineDividerEditionScreen from '#screens/LineDividerEditionScreen';
import type { LineDividerEditionMobileScreenQuery } from '@azzapp/relay/artifacts/LineDividerEditionMobileScreenQuery.graphql';
import type { LineDividerEditionScreen_module$key } from '@azzapp/relay/artifacts/LineDividerEditionScreen_module.graphql';
import type { PreloadedQuery } from 'react-relay';

type LineDividerEditionMobileScreenProps = {
  /**
   * The id of the module to edit
   */
  moduleId?: string;
  /**
   * The preloaded query for the screen
   */
  preloadedQuery: PreloadedQuery<LineDividerEditionMobileScreenQuery>;
};

/**
 * Mobile specific screen for the line divider module edition
 * (In case of future web support)
 */
const LineDividerEditionMobileScreen = ({
  moduleId,
  preloadedQuery,
}: LineDividerEditionMobileScreenProps) => {
  const data = usePreloadedQuery(LineDividerQuery, preloadedQuery);

  let module: LineDividerEditionScreen_module$key | null = null;
  if (moduleId != null) {
    module =
      data.viewer.profile?.card?.modules.find(
        module =>
          module?.id === moduleId && module?.kind === MODULE_KIND_LINE_DIVIDER,
      ) ?? null;
    if (!module) {
      // TODO
    }
  }

  return <LineDividerEditionScreen module={module} viewer={data.viewer} />;
};

const LineDividerQuery = graphql`
  query LineDividerEditionMobileScreenQuery {
    viewer {
      ...LineDividerEditionScreen_viewer
      profile {
        card {
          modules {
            id
            kind
            ...LineDividerEditionScreen_module
          }
        }
      }
    }
  }
`;

export default LineDividerEditionMobileScreen;

LineDividerEditionMobileScreen.prefetch = () =>
  fetchQuery(getRelayEnvironment(), LineDividerQuery, {});
