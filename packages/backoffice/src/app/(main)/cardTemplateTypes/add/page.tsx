import { WebCardCategoryTable, db } from '@azzapp/data/domains';
import CardTemplateTypesForm from '../CardTemplateTypesForm';
const NewCardTemplateTypePage = async () => {
  const webCardCategories = await db.select().from(WebCardCategoryTable);
  return <CardTemplateTypesForm webCardCategories={webCardCategories} />;
};

export default NewCardTemplateTypePage;
