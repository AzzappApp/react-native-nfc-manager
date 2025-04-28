import { graphql, useFragment } from 'react-relay';
import type { useContactCardAccess_profile$key } from '#relayArtifacts/useContactCardAccess_profile.graphql';

const useContactCardAccess = (
  profile?: useContactCardAccess_profile$key | null,
) => {
  const data = useFragment(
    graphql`
      fragment useContactCardAccess_profile on Profile
      @argumentDefinitions(
        deviceId: { type: "String!", provider: "qrCodeDeviceId.relayprovider" }
      ) {
        webCard {
          userName
        }
        contactCardAccessId(deviceId: $deviceId)
      }
    `,
    profile,
  );

  return data;
};

export default useContactCardAccess;
