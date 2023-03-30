import { graphql, usePreloadedQuery } from 'react-relay';
import relayScreen from '#helpers/relayScreen';
import CoverEditionScreen, {
  TemplateSelectorScreen,
} from '#screens/CoverEditionScreen';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { CardModuleEditionRoute } from '#routes';
import type { CardModuleEditionMobileScreenCoverQuery } from '@azzapp/relay/artifacts/CardModuleEditionMobileScreenCoverQuery.graphql';
import type { CardModuleEditionMobileScreenCoverWithTemplateQuery } from '@azzapp/relay/artifacts/CardModuleEditionMobileScreenCoverWithTemplateQuery.graphql';
import type { CardModuleEditionMobileScreenTemplateSelectorQuery } from '@azzapp/relay/artifacts/CardModuleEditionMobileScreenTemplateSelectorQuery.graphql';
import type { CoverEditionScreen_template$key } from '@azzapp/relay/artifacts/CoverEditionScreen_template.graphql';
import type { CoverEditionScreen_viewer$key } from '@azzapp/relay/artifacts/CoverEditionScreen_viewer.graphql';
import type { TemplateSelectorScreen_viewer$key } from '@azzapp/relay/artifacts/TemplateSelectorScreen_viewer.graphql';

const CardModuleEditionMobileScreen = ({
  preloadedQuery,
  route: { params },
}: RelayScreenProps<
  CardModuleEditionRoute,
  | CardModuleEditionMobileScreenCoverQuery
  | CardModuleEditionMobileScreenCoverWithTemplateQuery
  | CardModuleEditionMobileScreenTemplateSelectorQuery
>) => {
  const data = usePreloadedQuery(getQuery(params), preloadedQuery);
  if (!data.viewer) {
    return null;
  }

  switch (params.module) {
    case 'template-selector':
      return (
        <TemplateSelectorScreen
          viewer={data.viewer as TemplateSelectorScreen_viewer$key}
        />
      );
    case 'cover': {
      let node: CoverEditionScreen_template$key | null = null;
      if (params.templateId) {
        node = (data as any).node;
      }
      return (
        <CoverEditionScreen
          viewer={data.viewer as CoverEditionScreen_viewer$key}
          coverTemplate={node}
        />
      );
    }
    default:
      return null;
  }
};

const getQuery = (params: CardModuleEditionRoute['params']) => {
  switch (params.module) {
    case 'template-selector':
      return graphql`
        query CardModuleEditionMobileScreenTemplateSelectorQuery {
          viewer {
            ...TemplateSelectorScreen_viewer
          }
        }
      `;
    default:
      if (params.templateId) {
        return graphql`
          query CardModuleEditionMobileScreenCoverWithTemplateQuery(
            $templateId: ID!
          ) {
            viewer {
              ...CoverEditionScreen_viewer
            }
            node(id: $templateId) {
              ...CoverEditionScreen_template
            }
          }
        `;
      }
      return graphql`
        query CardModuleEditionMobileScreenCoverQuery {
          viewer {
            ...CoverEditionScreen_viewer
          }
        }
      `;
  }
};

const getVariables = (params: CardModuleEditionRoute['params']) => {
  switch (params.module) {
    case 'template-selector':
      return { module: params.module };
    default:
      return {
        module: params.module,
        templateId: params.templateId,
      };
  }
};

export default relayScreen(CardModuleEditionMobileScreen, {
  query: getQuery,
  getVariables,
});
