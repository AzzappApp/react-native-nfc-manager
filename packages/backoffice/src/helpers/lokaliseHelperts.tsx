import { LokaliseApi } from '@lokalise/node-api';

const lokaliseApi = new LokaliseApi({ apiKey: process.env.LOKALISE_TOKEN });

const DEV_LANG_ISO = 'dev-lang';

type Label = {
  labelKey: string;
  baseLabelValue: string;
};

export const saveLabelKey = async (params: Label | Label[]) => {
  const projectId = process.env.LOKALISE_PROJECT_ID;

  if (projectId) {
    if (Array.isArray(params)) {
      await lokaliseApi.keys().create(
        {
          keys: params.map(p => ({
            key_name: p.labelKey,
            platforms: ['other'],
            translations: [
              {
                language_iso: DEV_LANG_ISO,
                translation: p.baseLabelValue,
              },
            ],
            tags: ['backoffice'],
          })),
        },
        {
          project_id: projectId,
        },
      );
    } else {
      try {
        const foundKey = await lokaliseApi.keys().get(params.labelKey, {
          project_id: projectId,
        });

        await lokaliseApi.keys().list({
          project_id: projectId,
        });

        await lokaliseApi.keys().update(
          params.labelKey,
          {
            translations: [
              {
                language_iso: DEV_LANG_ISO,
                translation: params.baseLabelValue,
              },
              ...foundKey.translations.filter(
                translation => translation.language_iso !== DEV_LANG_ISO,
              ),
            ],
          },
          {
            project_id: projectId,
          },
        );
      } catch (error) {
        await lokaliseApi.keys().create(
          {
            keys: [
              {
                key_name: params.labelKey,
                platforms: ['other'],
                translations: [
                  {
                    language_iso: DEV_LANG_ISO,
                    translation: params.baseLabelValue,
                  },
                ],
                tags: ['backoffice'],
              },
            ],
          },
          {
            project_id: projectId,
          },
        );
      }
    }
  }
};
