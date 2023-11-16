import { useEffect } from 'react';
import { graphql, useMutation } from 'react-relay';

const UPDATE_WEBCARD_VIEWS = graphql`
  mutation useStatisticsWebcardViewsMutation($input: UpdateWebcardViewsInput!) {
    updateWebcardViews(input: $input)
  }
`;

export const UPDATE_CONTACTCARD_SCANS = graphql`
  mutation useStatisticsUpdateContactcardScansMutation(
    $input: UpdateContactcardScansInput!
  ) {
    updateContactcardScans(input: $input)
  }
`;

export function useWebcardViewStatistic(profileId: string | undefined) {
  const [commit] = useMutation(UPDATE_WEBCARD_VIEWS);
  useEffect(() => {
    if (profileId) {
      commit({
        variables: { input: { id: profileId } },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);
}
