import { useCallback } from 'react';
import { graphql, useMutation } from 'react-relay';
import type {
  useSendReportMutation,
  useSendReportMutation$data,
} from '#relayArtifacts/useSendReportMutation.graphql';

export const useSendReport = (
  id: string,
  onCompleted: (data: useSendReportMutation$data) => void,
  onError: () => void,
) => {
  const [commitSendReport, commitSendReportLoading] =
    useMutation<useSendReportMutation>(graphql`
      mutation useSendReportMutation($id: ID!) {
        sendReport(id: $id) {
          created
          report {
            targetId
          }
        }
      }
    `);

  const sendReport = useCallback(() => {
    commitSendReport({
      variables: {
        id,
      },
      onCompleted,
      onError,
    });
  }, [commitSendReport, id, onCompleted, onError]);

  return [sendReport, commitSendReportLoading] as const;
};
