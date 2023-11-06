import { notFound } from 'next/navigation';
import {
  CardTemplateTypeTable,
  CompanyActivityTable,
  db,
  getCompanyActivitiesByWebCardCategory,
  getWebCardCategoryById,
} from '@azzapp/data/domains';
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
  const categoryCompanyActivities = await getCompanyActivitiesByWebCardCategory(
    id,
  ).then(activities => activities.map(activity => activity.id));

  return (
    <WebCardCategoryForm
      webCardCategory={webCardCategory}
      companyActivities={companyActivities}
      categoryCompanyActivities={categoryCompanyActivities}
      cardTemplateTypes={cardTemplateTypes}
      saved={!!searchParams?.saved}
    />
  );
};

export default WebCardCategoryPage;
