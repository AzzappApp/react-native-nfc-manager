import { notFound } from 'next/navigation';
import {
  CardTemplateTypeTable,
  CompanyActivityTable,
  db,
  getCompanyActivitiesByWebCardCategory,
  getLocalizationMessagesByLocaleAndTarget,
  getWebCardCategoryById,
} from '@azzapp/data';
import { DEFAULT_LOCALE, ENTITY_TARGET } from '@azzapp/i18n';
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
  const labels = await getLocalizationMessagesByLocaleAndTarget(
    DEFAULT_LOCALE,
    ENTITY_TARGET,
  );
  const categoryCompanyActivities = await getCompanyActivitiesByWebCardCategory(
    id,
  ).then(activities => activities.map(activity => activity.id));

  return (
    <WebCardCategoryForm
      webCardCategory={webCardCategory}
      companyActivities={companyActivities}
      categoryCompanyActivities={categoryCompanyActivities}
      cardTemplateTypes={cardTemplateTypes}
      labels={labels}
      saved={!!searchParams?.saved}
    />
  );
};

export default WebCardCategoryPage;
