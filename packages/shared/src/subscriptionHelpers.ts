import type { ContactCard } from './contactCardHelpers';

export const isWebCardKindSubscription = (kind: string) => {
  return kind !== 'personal';
};

export const webCardRequiresSubscription = (webCard: {
  webCardKind: string;
  isMultiUser: boolean;
}) => {
  return webCard.isMultiUser || isWebCardKindSubscription(webCard.webCardKind);
};

//we don't have a param seat, users, metatdata  in IAP, so we are basing this info on the subscriptionID
export function extractSeatsFromSubscriptionId(id: string) {
  const parts = id.split('.');
  let number = parts.pop();
  if (number) {
    // Remove everything after (and including) the first colon
    number = number.split(':')[0];
    if (/^\d+$/.test(number)) {
      return parseInt(number, 10);
    }
  }
  return 0;
}

/**
 * Returns:
 *   1   for upgrade
 *   0   for same
 *  -1   for downgrade
 */
export function getSubscriptionChangeStatus(
  oldId: string,
  newId: string,
  oldDuration: string | null, //Subscription period, specified in ISO 8601 format. For example,
  newDuration: string | null,
): -1 | 0 | 1 {
  const oldSeats = extractSeatsFromSubscriptionId(oldId);
  const newSeats = extractSeatsFromSubscriptionId(newId);

  // If either ID is invalid (returns 0 seats), treat it as no change
  if (oldSeats === 0 || newSeats === 0) return 0;

  if (newSeats > oldSeats) return 1;
  if (newSeats < oldSeats) return -1;

  // If seats are the same, check duration
  if (oldDuration === newDuration) return 0;

  const oldMonths = getMonths(oldDuration);
  const newMonths = getMonths(newDuration);

  if (newMonths > oldMonths) return 1;
  if (newMonths < oldMonths) return -1;

  return 0; // fallback
}

// Convert durations to months for comparison(ISO 8601 format)
const getMonths = (duration: string | null): number => {
  switch (duration) {
    case 'P1M':
      return 1;
    case 'P3M':
      return 3;
    case 'P6M':
      return 6;
    case 'P1Y':
      return 12;
    case 'P2Y':
      return 24;
    case 'P3Y':
      return 36;
    default:
      return 0;
  }
};

/**
 * Removes the dynamic part after the colon in an ID
 * Example: "com.azzap.xxxX.wxcwxcwxc.azae:XXXX" -> "com.azzap.xxxX.wxcwxcwxc.azae"
 */
export function removeDynamicPartFromId(id: string): string {
  return id.split(':')[0];
}

export function shouldUnpublishWebCard({
  webCard,
  nbProfiles,
  profile,
}: {
  webCard:
    | { cardIsPublished?: boolean; webCardKind: string; isMultiUser: boolean }
    | null
    | undefined;
  nbProfiles: number;
  profile: { contactCard: ContactCard | null; logoId: string | null };
}): boolean {
  if (!webCard?.cardIsPublished) return false;
  return nbProfiles > 2 || isSubscriptionBusinessWebcard({ webCard, profile });
}

export function isSubscriptionBusinessWebcard({
  webCard,
  profile,
}: {
  webCard:
    | { cardIsPublished?: boolean; webCardKind: string; isMultiUser: boolean }
    | null
    | undefined;
  profile: { contactCard: ContactCard | null; logoId: string | null };
}): boolean {
  if (!webCard) return false;
  return (
    webCard.webCardKind !== 'personal' ||
    webCard.isMultiUser ||
    !!profile.contactCard?.company ||
    (profile.contactCard?.urls?.length ?? 0) > 0 ||
    !!profile.logoId
  );
}
