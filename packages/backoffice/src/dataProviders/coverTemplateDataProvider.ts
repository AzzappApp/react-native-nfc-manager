import { createId } from '@paralleldrive/cuid2';
import { db } from '@azzapp/data/domains';
import { getList, getMany, getOne } from './genericDataProvider';
import type { ResourceDataProvider } from './resourceDataProviders';
import type { CoverTemplate } from '@azzapp/data/domains';

const CoverTemplateDataProviders: ResourceDataProvider<CoverTemplate> = {
  getList: params => getList('CoverTemplate', params),
  getOne: params => getOne('CoverTemplate', params),
  getMany: params => getMany('CoverTemplate', params),
  update: async params => {
    const id = params.id as string;
    const { data } = params;
    delete data.updatedAt;
    delete data.createdAt;

    await db.transaction().execute(async trx => {
      const dataTemplate = data.data as any;
      // dataTempalte is a stringified json, so I need to have ALL the informations.
      // issue with the media, get the actual media to check is already in Media ressrouce
      if (dataTemplate.sourceMedia?.id) {
        const existingMedia = await trx
          .selectFrom('Media')
          .selectAll()
          .where('id', '=', dataTemplate.sourceMedia.id)
          .executeTakeFirst();
        if (existingMedia == null) {
          const media = dataTemplate.sourceMedia;
          await trx.insertInto('Media').values(media).execute();
          dataTemplate.sourceMediaId = media.id;
        }
      }
      const templateWithMedia = {
        ...data,
        data: JSON.stringify(dataTemplate),
      };

      await trx
        .updateTable('CoverTemplate')
        .set({ ...templateWithMedia })
        .where('id', '=', id)
        .executeTakeFirstOrThrow();
    });
    return CoverTemplateDataProviders.getOne({ id });
  },
  create: async params => {
    const { id: maybeId, ...coverTemplate } = params.data;
    const data = coverTemplate.data as any;
    const media = data.sourceMedia;
    const id = maybeId ?? createId();
    await db.transaction().execute(async trx => {
      await trx.insertInto('Media').values(media).execute();
      const templateWithMedia = {
        ...coverTemplate,
        data: JSON.stringify({
          ...data,
          sourceMediaId: media.id,
        }),
      };

      await trx
        .insertInto('CoverTemplate')
        .values({ id, ...templateWithMedia })
        .executeTakeFirstOrThrow();
    });

    return CoverTemplateDataProviders.getOne({ id });
  },
};

export default CoverTemplateDataProviders;
