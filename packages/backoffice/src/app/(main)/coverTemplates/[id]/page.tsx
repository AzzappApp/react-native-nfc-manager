import { eq, sql } from 'drizzle-orm';
import {
  CardTemplateTypeTable,
  CompanyActivityTable,
  CompanyActivityTypeTable,
  db,
  getColorPalettes,
  getCoverTemplateById,
  getCoverTemplatePreviewsByCoverTemplateId,
  getCoverTemplateTags,
  getCoverTemplateTypes,
  getLabel,
} from '@azzapp/data';

import CoverTemplateForm from '../CoverTemplatesForm';

export type ActivityItem = {
  id: string;
  label: string;
  activityTypeLabel: string;
};

const getActivitiesQuery = () => {
  const query = db
    .select({
      id: CompanyActivityTable.id,
      labelKey: CompanyActivityTable.labelKey,
      CompanyActivityTypeLabelKey: sql`${CompanyActivityTypeTable.labelKey}`
        .mapWith(String)
        .as('CompanyActivityTypeLabelKey'),
    })
    .from(CompanyActivityTable)
    .leftJoin(
      CardTemplateTypeTable,
      eq(CardTemplateTypeTable.id, CompanyActivityTable.cardTemplateTypeId),
    )
    .leftJoin(
      CompanyActivityTypeTable,
      eq(
        CompanyActivityTypeTable.id,
        CompanyActivityTable.companyActivityTypeId,
      ),
    );

  return query;
};

type CoverTemplatePageProps = {
  params: {
    id: string;
  };
};

const CoverTemplatePage = async ({
  params: { id },
}: CoverTemplatePageProps) => {
  const colorPalettes = await getColorPalettes();
  const coverTemplateTags = await getCoverTemplateTags();
  const coverTemplateTagsWithLabels = await Promise.all(
    coverTemplateTags.map(async tag => {
      const label = await getLabel(tag.labelKey);

      return { ...tag, label: label?.baseLabelValue || '' };
    }),
  );
  const coverTemplateTypes = await getCoverTemplateTypes();
  const coverTemplateTypesWithLabels = await Promise.all(
    coverTemplateTypes.map(async type => {
      const label = await getLabel(type.labelKey);

      return { ...type, label: label?.baseLabelValue || '' };
    }),
  );
  const activities = await getActivitiesQuery();
  const activitiesWithLabel: ActivityItem[] = await Promise.all(
    activities.map(async activity => {
      const label = await getLabel(activity.labelKey);
      const activityTypeLabel = await getLabel(
        activity.CompanyActivityTypeLabelKey,
      );

      return {
        id: activity.id,
        label: label?.baseLabelValue || 'unknown',
        activityTypeLabel: activityTypeLabel?.baseLabelValue || 'unknown',
      };
    }),
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
