import { fetchQuery, graphql, usePreloadedQuery } from 'react-relay';
import { MODULE_KIND_SIMPLE_TEXT } from '@azzapp/shared/cardModuleHelpers';
import { getRelayEnvironment } from '#helpers/relayEnvironment';
import SimpleTextEditionScreen from '#screens/SimpleTextEditionScreen';
import type { SimpleTextEditionMobileScreenQuery } from '@azzapp/relay/artifacts/SimpleTextEditionMobileScreenQuery.graphql';
import type { SimpleTextEditionScreen_module$key } from '@azzapp/relay/artifacts/SimpleTextEditionScreen_module.graphql';
import type { PreloadedQuery } from 'react-relay';

type SimpleTextEditionMobileScreenProps = {
  /**
   * The id of the module to edit
   */
  moduleId?: string;
  /**
   * The preloaded query for the screen
   */
  preloadedQuery: PreloadedQuery<SimpleTextEditionMobileScreenQuery>;
};

/**
 * Mobile specific screen for the simple text edition
 * (In case of future web support)
 */
const SimpleTextEditionMobileScreen = ({
  moduleId,
  preloadedQuery,
}: SimpleTextEditionMobileScreenProps) => {
  const data = usePreloadedQuery(SimpleTextQuery, preloadedQuery);

  let module: SimpleTextEditionScreen_module$key | null = null;
  if (moduleId != null) {
    module =
      data.viewer.profile?.card?.modules.find(
        module =>
          module?.id === moduleId && module?.kind === MODULE_KIND_SIMPLE_TEXT,
      ) ?? null;
    if (!module) {
      // TODO
    }
  }

  return <SimpleTextEditionScreen module={module} viewer={data.viewer} />;
};

const SimpleTextQuery = graphql`
  query SimpleTextEditionMobileScreenQuery {
    viewer {
      ...SimpleTextEditionScreen_viewer
      profile {
        card {
          modules {
            id
            kind
            ...SimpleTextEditionScreen_module
          }
        }
      }
    }
  }
`;

export default SimpleTextEditionMobileScreen;

SimpleTextEditionMobileScreen.prefetch = () =>
  fetchQuery(getRelayEnvironment(), SimpleTextQuery, {});
