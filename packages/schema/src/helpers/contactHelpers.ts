import type {
  EnrichedContactFields,
  EnrichedContactHiddenFields,
} from '@azzapp/data';

export const filterHiddenContactFields = (
  contact: EnrichedContactFields,
  hidden: EnrichedContactHiddenFields | null = {},
): EnrichedContactFields => {
  const result: any = {};
  for (const key in contact) {
    if (Object.prototype.hasOwnProperty.call(contact, key)) {
      const typedKey = key as keyof EnrichedContactFields;
      const value = contact[typedKey];
      const hideRule =
        hidden && hidden?.contact && typedKey in hidden.contact
          ? hidden.contact[
              typedKey as keyof EnrichedContactHiddenFields['contact']
            ]
          : undefined;
      if (Array.isArray(value)) {
        if (Array.isArray(hideRule)) {
          result[typedKey] = value
            ? (value.filter((_, i) => !hideRule[i]) as typeof value)
            : value;
        } else {
          result[typedKey] = hideRule ? undefined : value;
        }
      } else {
        result[typedKey] = hideRule ? undefined : value;
      }
    }
  }

  return result as EnrichedContactFields;
};
