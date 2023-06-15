import { createId } from '@paralleldrive/cuid2';
import { eq } from 'drizzle-orm';
import { CoverTemplateTable, db, MediaTable } from '@azzapp/data/domains';
import { getList, getMany, getOne } from './genericDataProvider';
import type { ResourceDataProvider } from './resourceDataProviders';
import type { CoverTemplate, Media, NewMedia } from '@azzapp/data/domains';

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

    await db.transaction(async trx => {
      const dataTemplate = data.data as CoverTemplate['data'] & {
        sourceMedia?: NewMedia;
      };
      // dataTempalte is a stringified json, so I need to have ALL the informations.
      // issue with the media, get the actual media to check is already in Media ressrouce
      if (dataTemplate?.sourceMedia?.id) {
        const existingMedia = await trx
          .select()
          .from(MediaTable)
          .where(eq(MediaTable.id, dataTemplate.sourceMedia.id))
          .then(res => res.pop() ?? null);
        if (existingMedia == null) {
          const media = dataTemplate.sourceMedia;
          await trx.insert(MediaTable).values(media);
          dataTemplate.sourceMediaId = media.id;
        }
      }
      const templateWithMedia = {
        ...data,
        data: dataTemplate,
      };

      await trx
        .update(CoverTemplateTable)
        .set({ ...templateWithMedia })
        .where(eq(CoverTemplateTable.id, id));
    });
    return CoverTemplateDataProviders.getOne({ id });
  },
  create: async params => {
    const { id: maybeId, ...coverTemplateData } = params.data;
    const data = coverTemplateData.data as any;

    const previewMediaId = coverTemplateData.previewMediaId;
    const id = maybeId ?? createId();
    await db.transaction(async trx => {
      const createInput = { ...coverTemplateData };
      if (previewMediaId) {
        await trx
          .insert(MediaTable)
          // eslint-disable-next-line @typescript-eslint/ban-types
          .values(previewMediaId as unknown as Media);
        createInput.previewMediaId = (previewMediaId as unknown as Media).id;
      }

      if (data.sourceMedia) {
        await trx.insert(MediaTable).values(data.sourceMedia);
        data.sourceMediaId = data.sourceMedia.id;
      }

      await trx.insert(CoverTemplateTable).values({ id, ...createInput, data });
    });

    return CoverTemplateDataProviders.getOne({ id });
  },
};

export default CoverTemplateDataProviders;
