import { getWebCardByProfileId } from '@azzapp/data';
import { profileLoader } from '#loaders';
import { idResolver } from '#helpers/relayIdHelpers';
import type { ContactResolvers } from '#/__generated__/types';

export const Contact: ContactResolvers = {
  id: idResolver('Contact'),
  avatar: contact => {
    return contact.avatarId
      ? {
          media: contact.avatarId,
          assetKind: 'contactCard',
        }
      : null;
  },
  webCard: contact => {
    if (contact.contactProfileId) {
      return getWebCardByProfileId(contact.contactProfileId);
    }
    return null;
  },
  ownerProfile: contact => {
    return profileLoader.load(contact.ownerProfileId);
  },
  contactProfile: contact => {
    if (contact.contactProfileId) {
      return profileLoader.load(contact.contactProfileId);
    }
    return null;
  },
};
