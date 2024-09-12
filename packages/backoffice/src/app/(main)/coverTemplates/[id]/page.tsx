import {
  getColorPalettes,
  getCompanyActivities,
  getCoverTemplateById,
  getCoverTemplatePreviewsByCoverTemplateId,
  getCoverTemplateTags,
  getCoverTemplateTypes,
  getLocalizationMessagesByLocaleAndTarget,
} from '@azzapp/data';

import { DEFAULT_LOCALE, ENTITY_TARGET } from '@azzapp/i18n';
import CoverTemplateForm from '../CoverTemplatesForm';

export type ActivityItem = {
  id: string;
  label: string;
  activityTypeLabel: string | null;
};

type CoverTemplatePageProps = {
  params: {
    id: string;
  };
};

const CoverTemplatePage = async ({
  params: { id },
}: CoverTemplatePageProps) => {
  const labelsMap = (
    await getLocalizationMessagesByLocaleAndTarget(
      DEFAULT_LOCALE,
      ENTITY_TARGET,
    )
  ).reduce(
    (acc, message) => {
      acc[message.key] = message.value;
      return acc;
    },
    {} as Record<string, string>,
  );

  const colorPalettes = await getColorPalettes();
  const coverTemplateTags = await getCoverTemplateTags();
  const coverTemplateTagsWithLabels = await Promise.all(
    coverTemplateTags.map(async tag => ({
      ...tag,
      label: labelsMap[tag.id],
    })),
  );
  const coverTemplateTypes = await getCoverTemplateTypes();
  const coverTemplateTypesWithLabels = await Promise.all(
    coverTemplateTypes.map(async type => ({
      ...type,
      label: labelsMap[type.id],
    })),
  );
  const activities = await getCompanyActivities();
  const activitiesWithLabel: ActivityItem[] = await Promise.all(
    activities.map(async activity => ({
      id: activity.id,
      label: labelsMap[activity.id],
      activityTypeLabel: activity.companyActivityTypeId
        ? labelsMap[activity.companyActivityTypeId]
        : null,
    })),
  );
  const coverTemplatePreviews =
    await getCoverTemplatePreviewsByCoverTemplateId(id);
  const coverTemplate = await getCoverTemplateById(id);

  return (
    <CoverTemplateForm
      coverTemplate={coverTemplate}
      colorPalettes={colorPalettes}
      coverTemplateTypes={coverTemplateTypesWithLabels}
      coverTemplateTags={coverTemplateTagsWithLabels}
      coverTemplatePreviews={coverTemplatePreviews}
      activities={activitiesWithLabel}
    />
  );
};

export default CoverTemplatePage;
