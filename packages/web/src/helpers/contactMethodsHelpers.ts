export enum CONTACT_METHODS {
  EMAIL = 'email',
  SMS = 'sms',
}

export type ContactMethods = {
  email: string | null;
  emailConfirmed: boolean;
  phoneNumber: string | null;
  phoneNumberConfirmed: boolean;
};

/**
 * Determines the preferred method of contact for a user based on the availability and confirmation
 * status of their contact methods, specifically their email address and phone number. The function follows a set of rules to select
 * the most suitable contact method according to the provided contact details.
 *
 * Rules:
 * 1. If the email is available and confirmed, it is chosen as the preferred method of contact.
 * 2. If the email is not confirmed but the phone number is confirmed, the phone number is chosen.
 * 3. If the email is available (even if not confirmed) and no confirmed phone number is available, the email is chosen.
 * 4. If both the email and phone number are confirmed, or if both are available but not confirmed, the email is preferred.
 * 5. If the phone number is available and confirmed, but no email is available, the phone number is chosen.
 * 6. If only the email or phone number is available (regardless of confirmation), that method is chosen.
 * 7. If neither is available or confirmed, the function returns undefined.
 *
 * @param {ContactMethods} contactMethods - An object with properties that represent the user's contact methods: email, emailConfirmed, phoneNumber, and phoneNumberConfirmed.
 * @returns { {method: CONTACT_METHODS, value: string} | undefined } - An object describing the preferred contact method (email or phone number), or undefined if no valid contact method is found.
 */
export function getPreferredContactMethod(
  contactMethods: ContactMethods,
): { method: CONTACT_METHODS; value: string } | undefined {
  const { email, emailConfirmed, phoneNumber, phoneNumberConfirmed } =
    contactMethods;

  if (email && (emailConfirmed || !phoneNumberConfirmed)) {
    return { method: CONTACT_METHODS.EMAIL, value: email };
  } else if (phoneNumber && phoneNumberConfirmed) {
    return { method: CONTACT_METHODS.SMS, value: phoneNumber };
  } else if (email) {
    return { method: CONTACT_METHODS.EMAIL, value: email };
  } else if (phoneNumber) {
    return { method: CONTACT_METHODS.SMS, value: phoneNumber };
  }

  return undefined;
}
