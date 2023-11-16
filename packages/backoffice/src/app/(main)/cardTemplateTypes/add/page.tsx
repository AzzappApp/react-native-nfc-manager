import { ProfileCategoryTable, db } from '@azzapp/data/domains';
import CardTemplateTypesForm from '../CardTemplateTypesForm';
const NewCardTemplateTypePage = async () => {
  const profileCategories = await db.select().from(ProfileCategoryTable);
  return <CardTemplateTypesForm profileCategories={profileCategories} />;
};

export default NewCardTemplateTypePage;
