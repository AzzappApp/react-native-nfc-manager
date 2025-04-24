export const displayName = (
  contact: {
    firstName?: string | null;
    lastName?: string | null;
    company?: string | null;
  },
  webCard: { userName?: string | null } | null,
) => {
  if (contact.firstName || contact.lastName) {
    return `${contact.firstName ?? ''}  ${contact.lastName ?? ''}`.trim();
  }

  if (contact.company) {
    return contact.company;
  }
  return webCard?.userName ?? '';
};
