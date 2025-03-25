import { useMemo } from 'react';
import type { ContactType } from '#helpers/contactListHelpers';

const useImageFromContact = (contact: ContactType) => {
  return useMemo(() => {
    if (contact.contactProfile?.avatar?.uri) {
      return {
        uri: contact.contactProfile.avatar.uri,
        mediaId: contact.contactProfile.avatar.id ?? '',
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
    if (contact.logo?.uri) {
      return {
        uri: contact.logo?.uri,
        mediaId: contact.logo?.id ?? '',
        requestedSize: 26,
      };
    }
    return null;
  }, [
    contact.avatar?.id,
    contact.avatar?.uri,
    contact.contactProfile?.avatar?.id,
    contact.contactProfile?.avatar?.uri,
    contact.logo?.id,
    contact.logo?.uri,
  ]);
};

export default useImageFromContact;
