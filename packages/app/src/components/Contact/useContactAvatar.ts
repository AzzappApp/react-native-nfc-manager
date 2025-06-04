import { useMemo } from 'react';
import { useFragment } from 'react-relay';
import { graphql } from 'relay-runtime';
import { getLocalCachedMediaFile } from '#helpers/mediaHelpers/remoteMediaCache';
import type { useContactAvatar_contact$key } from '#relayArtifacts/useContactAvatar_contact.graphql';

const useContactAvatar = (contactKey?: useContactAvatar_contact$key | null) => {
  const contact = useFragment(
    graphql`
      fragment useContactAvatar_contact on Contact
      @argumentDefinitions(
        pixelRatio: {
          type: "Float!"
          provider: "CappedPixelRatio.relayprovider"
        }
      ) {
        displayedAvatar {
          source {
            id
            ... on MediaVideo {
              mediaSource: thumbnail(width: 180, pixelRatio: $pixelRatio)
            }
            ... on MediaImage {
              mediaSource: uri(width: 180, pixelRatio: $pixelRatio)
            }
          }
        }
      }
    `,
    contactKey,
  );

  return useMemo(() => {
    if (contact?.displayedAvatar?.source?.id) {
      const localFile = getLocalCachedMediaFile(
        contact?.displayedAvatar?.source?.id,
        'image',
      );

      return {
        mediaId: contact?.displayedAvatar?.source?.id,
        uri: localFile || contact?.displayedAvatar?.source.mediaSource || '',
        requestedSize: 180,
      };
    }

    return null;
  }, [
    contact?.displayedAvatar?.source?.id,
    contact?.displayedAvatar?.source?.mediaSource,
  ]);
};

export default useContactAvatar;
