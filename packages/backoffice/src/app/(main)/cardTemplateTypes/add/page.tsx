import {
  WebCardCategoryTable,
  db,
  getLocalizationMessagesByLocaleAndTarget,
} from '@azzapp/data';
import { DEFAULT_LOCALE, ENTITY_TARGET } from '@azzapp/i18n';
import CardTemplateTypesForm from '../CardTemplateTypesForm';
const NewCardTemplateTypePage = async () => {
  const webCardCategories = await db.select().from(WebCardCategoryTable);

  const labels = await getLocalizationMessagesByLocaleAndTarget(
    DEFAULT_LOCALE,
    ENTITY_TARGET,
  );

  return (
    <CardTemplateTypesForm
      webCardCategories={webCardCategories}
      labels={labels}
    />
  );
};

export default NewCardTemplateTypePage;
