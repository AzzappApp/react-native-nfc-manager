import { graphql, useMutation } from 'react-relay';
import type { useLoadCardTemplateMutation as UseLoadCardTemplateMutation } from '#relayArtifacts/useLoadCardTemplateMutation.graphql';

const useLoadCardTemplateMutation = () => {
  return useMutation<UseLoadCardTemplateMutation>(graphql`
    mutation useLoadCardTemplateMutation(
      $webCardId: ID!
      $cardTemplateId: ID!
    ) {
      loadCardTemplate(webCardId: $webCardId, cardTemplateId: $cardTemplateId) {
        webCard {
          id
          cardStyle {
            borderColor
            borderRadius
            buttonRadius
            borderWidth
            buttonColor
            fontFamily
            fontSize
            gap
            titleFontFamily
            titleFontSize
          }
          cardModules {
            id
            visible
            variant
            ...ModuleData_cardModules
          }
        }
      }
    }
  `);
};

export default useLoadCardTemplateMutation;
