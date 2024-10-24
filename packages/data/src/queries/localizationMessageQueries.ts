import { and, eq, inArray } from 'drizzle-orm';
import { db } from '../database';
import { LocalizationMessageTable, type LocalizationMessage } from '../schema';

/**
 * Retrieve all localization messages.
 *
 * @returns a list of all localization messages
 */
export const getLocalizationMessages = async (): Promise<
  LocalizationMessage[]
> => db().select().from(LocalizationMessageTable);

/**
 * Retrieve localization messages by keys for a specific locale and target.
 *
 * @param keys - The keys of the localization messages list to retrieve
 * @param locale - The locale of the localization messages list to retrieve
 * @param target - The target of the localization messages list to retrieve
 *
 * @returns
 *  An array corresponding to the ids provided with for each index
 *  the corresponding localization message if it exists
 */
export const getLocalizationMessagesByKeys = async (
  keys: string[],
  locale: string,
  target: string,
): Promise<Array<LocalizationMessage | null>> => {
  const messages = await db()
    .select()
    .from(LocalizationMessageTable)
    .where(
      and(
        eq(LocalizationMessageTable.target, target),
        eq(LocalizationMessageTable.locale, locale),
        inArray(LocalizationMessageTable.key, keys),
      ),
    );
  const messagesMap = new Map<string, LocalizationMessage>();
  messages.forEach(message => messagesMap.set(message.key, message));
  return keys.map(key => messagesMap.get(key) ?? null);
};

/**
 * Retrieve a list of localization messages for a specific locale and target.
 *
 * @param locale - The locale by which to filter the list of localization messages
 * @param target - The target by which to filter the list of localization messages
 *
 * @returns a list of localization messages for the specified locale and target
 */
export const getLocalizationMessagesByLocaleAndTarget = async (
  locale: string,
  target: string,
): Promise<LocalizationMessage[]> => {
  return db()
    .select()
    .from(LocalizationMessageTable)
    .where(
      and(
        eq(LocalizationMessageTable.locale, locale),
        eq(LocalizationMessageTable.target, target),
      ),
    );
};

/**
 * Retrieve a list of localization messages for a specific target.
 *
 * @param target - The target by which to filter the list of localization messages
 *
 * @returns a list of localization messages for the specified target
 */
export const getLocalizationMessagesByTarget = async (
  target: string,
): Promise<LocalizationMessage[]> => {
  return db()
    .select()
    .from(LocalizationMessageTable)
    .where(and(eq(LocalizationMessageTable.target, target)));
};

/**
 * Retrieve a list of localization messages for a specific locale.
 *
 * @param locale - The locale by which to filter the list of localization messages
 * @returns
 */
export const getLocalizationMessagesByLocale = async (
  locale: string,
): Promise<LocalizationMessage[]> => {
  return db()
    .select()
    .from(LocalizationMessageTable)
    .where(eq(LocalizationMessageTable.locale, locale));
};

/**
 * Save a localization message, creating it if it doesn't exist or updating it if it does.
 *
 * @param message - The LocalizationMessage to save
 */
export const saveLocalizationMessage = async (message: LocalizationMessage) => {
  await db()
    .insert(LocalizationMessageTable)
    .values(message)
    .onDuplicateKeyUpdate({
      set: { value: message.value },
    });
};

export const createLocalizationMessages = async (
  messages: LocalizationMessage[],
) => {
  await db().insert(LocalizationMessageTable).values(messages);
};
