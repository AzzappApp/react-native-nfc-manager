import { asc } from 'drizzle-orm';
import { ProfileCategoryTable, db } from '@azzapp/data/domains';
import ProfileCategoriesList from './ProfileCategoriesList';

const ProfileCategoriesPage = async () => {
  const profileCategories = await db
    .select()
    .from(ProfileCategoryTable)
    .orderBy(asc(ProfileCategoryTable.order));

  return <ProfileCategoriesList profileCategories={profileCategories} />;
};

export default ProfileCategoriesPage;
