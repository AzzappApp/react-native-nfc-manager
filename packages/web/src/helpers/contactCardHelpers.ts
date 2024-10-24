export const displayName = (
  contact: { firstName?: string; lastName?: string; company?: string },
  webCard: { userName: string } | null,
) => {
  if (contact.firstName || contact.lastName) {
    return `${contact.firstName ?? ''}  ${contact.lastName ?? ''}`.trim();
  }

  if (contact.company) {
    return contact.company;
  }
  return webCard?.userName ?? '';
};
