import { graphql, usePreloadedQuery } from 'react-relay';
import TemplateSelector from '#components/TemplateSelector';
import relayScreen from '#helpers/relayScreen';
import CoverEditionScreen from '#screens/CoverEditionScreen';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { CardModuleEditionRoute } from '#routes';
import type { CardModuleEditionMobileScreenQuery } from '@azzapp/relay/artifacts/CardModuleEditionMobileScreenQuery.graphql';
import type { TemplateSelector_viewer$key } from '@azzapp/relay/artifacts/TemplateSelector_viewer.graphql';

const CardModuleEditionMobileScreen = ({
  preloadedQuery,
  route: { params },
}: RelayScreenProps<
  CardModuleEditionRoute,
  CardModuleEditionMobileScreenQuery
>) => {
  const data = usePreloadedQuery(getQuery(params), preloadedQuery);
  if (!data.viewer) {
    return null;
  }

  switch (params?.module) {
    case 'template-selector':
      return (
        <TemplateSelector
          viewer={data.viewer as unknown as TemplateSelector_viewer$key}
        />
      );
    default:
      return (
        <CoverEditionScreen viewer={data.viewer} coverTemplate={data.node} />
      );
  }
};

const getQuery = (params: CardModuleEditionRoute['params']) => {
  switch (params.module) {
    case 'template-selector':
      return graphql`
        query CardModuleEditionMobileScreenTemplateSelectorQuery {
          viewer {
            ...TemplateSelector_viewer
          }
        }
      `;
    default:
      return graphql`
        query CardModuleEditionMobileScreenQuery($templateId: ID!) {
          viewer {
            ...CoverEditionScreen_viewer
          }
          node(id: $templateId) {
            ...CoverEditionScreen_template
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
