import { graphql, useMutation } from 'react-relay';
import type { useAcceptTermsOfUseMutation as AcceptTermsOfUseMutation } from '#relayArtifacts/useAcceptTermsOfUseMutation.graphql';

const useAcceptTermsOfUseMutation = () => {
  return useMutation<AcceptTermsOfUseMutation>(graphql`
    mutation useAcceptTermsOfUseMutation {
      acceptTermsOfUse {
        user {
          hasAcceptedLastTermsOfUse
        }
      }
    }
  `);
};

export default useAcceptTermsOfUseMutation;
