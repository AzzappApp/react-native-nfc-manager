import { notFound } from 'next/navigation';
import {
  CardTemplateTypeTable,
  CompanyActivityTable,
  db,
  getCompanyActivitiesByWebCardCategory,
  getLabel,
  getLabels,
  getWebCardCategoryById,
} from '@azzapp/data';
import WebCardCategoryForm from '../WebCardCategoryForm';

type WebCardCategoryPageProps = {
  params: {
    id: string;
  };
  searchParams?: {
    saved?: string;
  };
};

const WebCardCategoryPage = async ({
  params: { id },
  searchParams,
}: WebCardCategoryPageProps) => {
  const webCardCategory = await getWebCardCategoryById(id);
  if (!webCardCategory) {
    return notFound();
  }
  const companyActivities = await db.select().from(CompanyActivityTable);
  const cardTemplateTypes = await db.select().from(CardTemplateTypeTable);
  const labels = await getLabels(
    cardTemplateTypes
      .map(({ labelKey }) => labelKey)
      .concat(companyActivities.map(({ labelKey }) => labelKey)),
  );
  const categoryCompanyActivities = await getCompanyActivitiesByWebCardCategory(
    id,
  ).then(activities => activities.map(activity => activity.id));

  const label = await getLabel(webCardCategory.labelKey);

  return (
    <WebCardCategoryForm
      webCardCategory={webCardCategory}
      companyActivities={companyActivities}
      categoryCompanyActivities={categoryCompanyActivities}
      cardTemplateTypes={cardTemplateTypes}
      labels={labels}
      saved={!!searchParams?.saved}
      label={label}
    />
  );
};

export default WebCardCategoryPage;
