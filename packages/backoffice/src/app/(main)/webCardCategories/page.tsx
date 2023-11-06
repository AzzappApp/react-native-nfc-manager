import { asc } from 'drizzle-orm';
import { WebCardCategoryTable, db } from '@azzapp/data/domains';
import WebCardCategoriesList from './WebCardCategoriesList';

const ProfileCategoriesPage = async () => {
  const webCardCategories = await db
    .select()
    .from(WebCardCategoryTable)
    .orderBy(asc(WebCardCategoryTable.order));

  return <WebCardCategoriesList webCardCategories={webCardCategories} />;
};

export default ProfileCategoriesPage;
