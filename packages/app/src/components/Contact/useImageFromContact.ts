import { useMemo } from 'react';
import { useFragment } from 'react-relay';
import { graphql } from 'relay-runtime';
import type { useImageFromContact_contact$key } from '#relayArtifacts/useImageFromContact_contact.graphql';

const useImageFromContact = (contactKey: useImageFromContact_contact$key) => {
  const contact = useFragment(
    graphql`
      fragment useImageFromContact_contact on Contact
      @argumentDefinitions(
        pixelRatio: {
          type: "Float!"
          provider: "CappedPixelRatio.relayprovider"
        }
      ) {
        avatar {
          id
          uri(width: 112, pixelRatio: $pixelRatio, format: png)
        }
        logo {
          id
          uri(width: 180, pixelRatio: $pixelRatio, format: png)
        }
        enrichment {
          fields {
            avatar {
              id
              uri(width: 112, pixelRatio: $pixelRatio, format: png)
            }
            logo {
              id
              uri(width: 180, pixelRatio: $pixelRatio, format: png)
            }
          }
        }
        contactProfile {
          webCard {
            id
            cardIsPublished
            userName
            hasCover
            coverMedia {
              id
              ... on MediaVideo {
                mediaSource: thumbnail(width: 125, pixelRatio: $pixelRatio)
              }
              ... on MediaImage {
                mediaSource: uri(width: 125, pixelRatio: $pixelRatio)
              }
            }
          }
        }
      }
    `,
    contactKey,
  );

  return useMemo(() => {
    if (contact.enrichment?.fields?.avatar?.uri) {
      return {
        uri: contact.enrichment.fields.avatar.uri,
        mediaId: contact.enrichment.fields.avatar.id ?? '',
        requestedSize: 26,
      };
    }
    if (contact.avatar?.uri) {
      return {
        uri: contact.avatar.uri,
        mediaId: contact.avatar.id ?? '',
        requestedSize: 26,
      };
    }
    if (contact.enrichment?.fields?.logo?.uri) {
      return {
        uri: contact.enrichment.fields.logo.uri,
        mediaId: contact.enrichment.fields.logo.id ?? '',
        requestedSize: 26,
      };
    }
    if (contact.logo?.uri) {
      return {
        uri: contact.logo?.uri,
        mediaId: contact.logo?.id ?? '',
        requestedSize: 26,
      };
    }
    if (
      contact.contactProfile?.webCard?.coverMedia &&
      contact.contactProfile?.webCard?.hasCover &&
      contact.contactProfile?.webCard?.cardIsPublished &&
      contact.contactProfile?.webCard?.coverMedia?.mediaSource
    ) {
      return {
        mediaId: contact.contactProfile.webCard.coverMedia.id,
        uri: contact.contactProfile.webCard.coverMedia.mediaSource,
        requestedSize: 125,
      };
    }

    return null;
  }, [
    contact.enrichment?.fields?.avatar?.uri,
    contact.enrichment?.fields?.avatar?.id,
    contact.enrichment?.fields?.logo?.uri,
    contact.enrichment?.fields?.logo?.id,
    contact.avatar?.uri,
    contact.avatar?.id,
    contact.logo?.uri,
    contact.logo?.id,
    contact.contactProfile?.webCard?.coverMedia,
    contact.contactProfile?.webCard?.hasCover,
    contact.contactProfile?.webCard?.cardIsPublished,
  ]);
};

export default useImageFromContact;
