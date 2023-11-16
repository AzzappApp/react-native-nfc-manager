import { notFound } from 'next/navigation';
import {
  CardTemplateTypeTable,
  CompanyActivityTable,
  db,
  getCompanyActivitiesByProfileCategory,
  getProfileCategoryById,
} from '@azzapp/data/domains';
import ProfileCategoryForm from '../ProfileCategoryForm';

type ProfileCategoryPageProps = {
  params: {
    id: string;
  };
  searchParams?: {
    saved?: string;
  };
};

const ProfileCategoryPage = async ({
  params: { id },
  searchParams,
}: ProfileCategoryPageProps) => {
  const profileCategory = await getProfileCategoryById(id);
  if (!profileCategory) {
    return notFound();
  }
  const companyActivities = await db.select().from(CompanyActivityTable);
  const cardTemplateTypes = await db.select().from(CardTemplateTypeTable);
  const categoryCompanyActivities = await getCompanyActivitiesByProfileCategory(
    id,
  ).then(activities => activities.map(activity => activity.id));

  return (
    <ProfileCategoryForm
      profileCategory={profileCategory}
      companyActivities={companyActivities}
      categoryCompanyActivities={categoryCompanyActivities}
      cardTemplateTypes={cardTemplateTypes}
      saved={!!searchParams?.saved}
    />
  );
};

export default ProfileCategoryPage;
