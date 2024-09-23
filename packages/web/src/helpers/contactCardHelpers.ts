import type { WebCard } from '@azzapp/data';

export const displayName = (
  contact: { firstName?: string; lastName?: string; company?: string },
  webCard: WebCard,
) => {
  if (contact) {
    if (contact.firstName || contact.lastName) {
      return `${contact.firstName ?? ''}  ${contact.lastName ?? ''}`.trim();
    }
    if (contact.company) {
      return contact.company;
    }
  }
  if (webCard.firstName || webCard.lastName) {
    return `${webCard.firstName ?? ''}  ${webCard.lastName ?? ''}`.trim();
  }
  if (webCard.companyName) {
    return webCard.companyName;
  }
  return webCard.userName;
};
