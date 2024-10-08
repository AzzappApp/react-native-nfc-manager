import { getWebCardByProfileId } from '@azzapp/data';
import { profileLoader } from '#loaders';
import type { ContactResolvers } from '#/__generated__/types';

export const Contact: ContactResolvers = {
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
