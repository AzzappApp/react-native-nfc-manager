import { graphql, usePreloadedQuery } from 'react-relay';
import { MODULE_KIND_SIMPLE_BUTTON } from '@azzapp/shared/cardModuleHelpers';
import SimpleButtonEditionScreen from '#screens/SimpleButtonEditionScreen';
import type { SimpleButtonEditionMobileScreenQuery } from '@azzapp/relay/artifacts/SimpleButtonEditionMobileScreenQuery.graphql';
import type { SimpleButtonEditionScreen_module$key } from '@azzapp/relay/artifacts/SimpleButtonEditionScreen_module.graphql';
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
  const data = usePreloadedQuery(SimpleButtonQuery, preloadedQuery);

  let module: SimpleButtonEditionScreen_module$key | null = null;
  if (moduleId != null) {
    module =
      data.viewer.profile?.webCard.cardModules.find(
        module =>
          module?.id === moduleId && module?.kind === MODULE_KIND_SIMPLE_BUTTON,
      ) ?? null;
    if (!module) {
      // TODO
    }
  }

  return <SimpleButtonEditionScreen module={module} viewer={data.viewer} />;
};

const SimpleButtonQuery = graphql`
  query SimpleButtonEditionMobileScreenQuery {
    viewer {
      ...SimpleButtonEditionScreen_viewer
      profile {
        webCard {
          cardModules {
            id
            kind
            ...SimpleButtonEditionScreen_module
          }
        }
      }
    }
  }
`;

export default SimpleButtonEditionMobileScreen;
