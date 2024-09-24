export const displayName = (
  contact: { firstName?: string; lastName?: string; companyName?: string },
  webCard: { userName: string } | null,
) => {
  if (contact.firstName || contact.lastName) {
    return `${contact.firstName ?? ''}  ${contact.lastName ?? ''}`.trim();
  }

  if (contact.companyName) {
    return contact.companyName;
  }
  return webCard?.userName ?? '';
};
