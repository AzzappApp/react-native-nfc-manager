import { useMemo } from 'react';
import type { ContactType } from '#helpers/contactTypes';

const useImageFromContact = (contact: ContactType) => {
  return useMemo(() => {
    if (contact.avatar?.uri) {
      return {
        uri: contact.avatar.uri,
        mediaId: contact.avatar.id ?? '',
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
    if (contact.webCardPreview?.uri) {
      return {
        uri: contact.webCardPreview?.uri,
        mediaId: contact.webCardPreview?.id ?? '',
        requestedSize: 26,
      };
    }

    return null;
  }, [
    contact.avatar?.id,
    contact.avatar?.uri,
    contact.logo?.id,
    contact.logo?.uri,
    contact.webCardPreview,
  ]);
};

export default useImageFromContact;
