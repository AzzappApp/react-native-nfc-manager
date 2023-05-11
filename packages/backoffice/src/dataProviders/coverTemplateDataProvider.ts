import { createId } from '@paralleldrive/cuid2';
import { db } from '@azzapp/data/domains';
import { getList, getMany, getOne } from './genericDataProvider';
import type { ResourceDataProvider } from './resourceDataProviders';
import type { CoverTemplate, Media } from '@azzapp/data/domains';

export type CoverTemplateWithCompanyActivities = CoverTemplate & {
  companyActivities: Array<string | null>;
};

const CoverTemplateDataProviders: ResourceDataProvider<
  CoverTemplate,
  CoverTemplateWithCompanyActivities
> = {
  getList: params => getList('CoverTemplate', params),
  getOne: async params => {
    const { data: coverTemplate } = await getOne('CoverTemplate', params);
    return {
      data: {
        ...coverTemplate,
        companyActivities: coverTemplate.companyActivityIds?.split(',') ?? [],
      },
    };
  },
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

    const previewMediaId = coverTemplate.previewMediaId;
    const id = maybeId ?? createId();
    await db.transaction().execute(async trx => {
      const createInput = { ...coverTemplate };
      if (previewMediaId) {
        await trx
          .insertInto('Media')
          // eslint-disable-next-line @typescript-eslint/ban-types
          .values(previewMediaId as unknown as Media)
          .execute();
        createInput.previewMediaId = (previewMediaId as unknown as Media).id;
      }

      if (data.sourceMedia) {
        await trx.insertInto('Media').values(data.sourceMedia).execute();
        data.sourceMediaId = data.sourceMedia.id;
      }

      await trx
        .insertInto('CoverTemplate')
        .values({ id, ...createInput, data: JSON.stringify(data) })
        .executeTakeFirstOrThrow();
    });

    return CoverTemplateDataProviders.getOne({ id });
  },
};

export default CoverTemplateDataProviders;
