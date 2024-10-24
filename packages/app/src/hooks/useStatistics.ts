import { useEffect } from 'react';
import { graphql, useMutation } from 'react-relay';
import { getAuthState } from '#helpers/authStore';

const UPDATE_WEB_CARD_VIEWS = graphql`
  mutation useStatisticsWebcardViewsMutation($input: UpdateWebCardViewsInput!) {
    updateWebCardViews(input: $input)
  }
`;

export const UPDATE_CONTACT_CARD_SCANS = graphql`
  mutation useStatisticsUpdateContactcardScansMutation(
    $input: UpdateContactCardScansInput!
  ) {
    updateContactCardScans(input: $input)
  }
`;

export function useWebCardViewStatistic(webCardId: string | undefined) {
  const [commit] = useMutation(UPDATE_WEB_CARD_VIEWS);
  useEffect(() => {
    if (webCardId) {
      const { profileInfos } = getAuthState();
      commit({
        variables: { input: { webCardId, profileId: profileInfos?.profileId } },
      });
    }
  }, [commit, webCardId]);
}
