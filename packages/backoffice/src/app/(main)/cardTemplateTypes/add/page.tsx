import { WebCardCategoryTable, db, getLabels } from '@azzapp/data';
import CardTemplateTypesForm from '../CardTemplateTypesForm';
const NewCardTemplateTypePage = async () => {
  const webCardCategories = await db.select().from(WebCardCategoryTable);

  const webCardCategoriesLabels = await getLabels(
    webCardCategories.map(webCardCategory => webCardCategory.labelKey),
  );

  return (
    <CardTemplateTypesForm
      webCardCategories={webCardCategories}
      webCardCategoriesLabels={webCardCategoriesLabels}
    />
  );
};

export default NewCardTemplateTypePage;
