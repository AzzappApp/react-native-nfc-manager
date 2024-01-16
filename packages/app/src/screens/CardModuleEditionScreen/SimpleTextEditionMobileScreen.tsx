import { graphql, usePreloadedQuery } from 'react-relay';
import SimpleTextEditionScreen from '#screens/SimpleTextEditionScreen';
import type { SimpleTextEditionMobileScreenQuery } from '#relayArtifacts/SimpleTextEditionMobileScreenQuery.graphql';
import type { SimpleTextEditionScreen_module$key } from '#relayArtifacts/SimpleTextEditionScreen_module.graphql';
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
  /**
   * The current module kind edited, can be simpleText or simpleTitle
   */
  moduleKind: 'simpleText' | 'simpleTitle';
};

/**
 * Mobile specific screen for the simple text edition
 * (In case of future web support)
 */
const SimpleTextEditionMobileScreen = ({
  moduleId,
  preloadedQuery,
  moduleKind,
}: SimpleTextEditionMobileScreenProps) => {
  const data = usePreloadedQuery(SimpleTextQuery, preloadedQuery);

  let module: SimpleTextEditionScreen_module$key | null = null;
  if (moduleId != null) {
    module =
      data.viewer.profile?.webCard.cardModules.find(
        module => module?.id === moduleId && module?.kind === moduleKind,
      ) ?? null;
    if (!module) {
      // TODO
    }
  }

  return (
    <SimpleTextEditionScreen
      module={module}
      viewer={data.viewer}
      moduleKind={moduleKind}
    />
  );
};

const SimpleTextQuery = graphql`
  query SimpleTextEditionMobileScreenQuery {
    viewer {
      ...SimpleTextEditionScreen_viewer
      profile {
        webCard {
          cardModules {
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
