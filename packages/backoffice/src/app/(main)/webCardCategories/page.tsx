import { asc } from 'drizzle-orm';
import { WebCardCategoryTable, db } from '@azzapp/data';
import WebCardCategoriesList from './WebCardCategoriesList';

const ProfileCategoriesPage = async () => {
  const webCardCategories = await db
    .select()
    .from(WebCardCategoryTable)
    .orderBy(asc(WebCardCategoryTable.order));

  return (
    <WebCardCategoriesList
      webCardCategories={webCardCategories}
      pageSize={PAGE_SIZE}
    />
  );
};

export default ProfileCategoriesPage;

const PAGE_SIZE = 25;
