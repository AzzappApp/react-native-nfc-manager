import { getWebCardByProfileId } from '@azzapp/data';
import { profileLoader } from '#loaders';
import type { ContactResolvers } from '#/__generated__/types';

export const Contact: ContactResolvers = {
  webCard: contact => {
    return getWebCardByProfileId(contact.contactProfileId);
  },
  ownerProfile: contact => {
    return profileLoader.load(contact.ownerProfileId);
  },
  contactProfile: contact => {
    return profileLoader.load(contact.contactProfileId);
  },
};
