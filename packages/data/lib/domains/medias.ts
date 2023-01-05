import { v4 as uuid } from 'uuid';
import db from './db';
import type { Database } from './db';
import type { Media } from '@prisma/client';
import type { QueryCreator } from 'kysely';

/**
 * Retrieve medias by their owner ids
 * @param ownerIds - The owner ids
 * @returns The medias grouped by their owner ids in the same order as the owner ids
 */
export const getMedias = async (ownerIds: readonly string[]) => {
  const medias = await db
    .selectFrom('Media')
    .selectAll()
    .where('ownerId', 'in', ownerIds)
    .execute();

  const mediasMap = new Map<string, Media[]>();
  medias.forEach(media => {
    if (!mediasMap.has(media.ownerId)) {
      mediasMap.set(media.ownerId, [media]);
    } else {
      mediasMap.get(media.ownerId)?.push(media);
    }
  });

  return ownerIds.map(id => mediasMap.get(id) ?? null);
};

/**
 * Create a media.
 *
 * @param values - the media fields, excluding the id
 * @param qc - The query creator to use (user for transactions)
 * @returns The created media
 */
export const createMedia = async (
  values: Omit<Media, 'id'>,
  qc: QueryCreator<Database> = db,
): Promise<Media> => {
  const media = {
    id: uuid(),
    postDate: new Date(),
    ...values,
  };
  await qc.insertInto('Media').values(media).execute();
  return media;
};
