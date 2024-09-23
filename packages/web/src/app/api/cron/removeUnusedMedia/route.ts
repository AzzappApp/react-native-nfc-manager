import { waitUntil } from '@vercel/functions';
import { getUnusedMedias, removeMedias } from '@azzapp/data';
import { deleteMediaByPublicIds } from '@azzapp/shared/cloudinaryHelpers';
import { withPluginsRoute } from '#helpers/queries';
import type { NextRequest } from 'next/server';

export const GET = withPluginsRoute((request: NextRequest) => {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', {
      status: 401,
    });
  }

  waitUntil(removeUnusedMedia());

  return Response.json({ success: true });
});

const MEDIA_DELETION_SLOT_SIZE = parseInt(
  process.env.MEDIA_DELETION_SLOT_SIZE || '',
  10,
);

const removeUnusedMedia = async () => {
  const media = await getUnusedMedias(
    isNaN(MEDIA_DELETION_SLOT_SIZE) ? 10 : MEDIA_DELETION_SLOT_SIZE,
  );

  if (media.length) {
    await deleteMediaByPublicIds(
      media.map(m => ({ publicId: m.id, kind: m.kind })),
    );

    await removeMedias(media.map(m => m.id));
  }
};
