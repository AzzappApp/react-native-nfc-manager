import {
  getLocalizationMessagesByLocaleAndTarget,
  getWebCardCategories,
} from '@azzapp/data';
import { DEFAULT_LOCALE, ENTITY_TARGET } from '@azzapp/i18n';
import CardTemplateTypesForm from '../CardTemplateTypesForm';
const NewCardTemplateTypePage = async () => {
  const [webCardCategories, labels] = await Promise.all([
    getWebCardCategories(),
    getLocalizationMessagesByLocaleAndTarget(DEFAULT_LOCALE, ENTITY_TARGET),
  ]);

  return (
    <CardTemplateTypesForm
      webCardCategories={webCardCategories}
      labels={labels}
    />
  );
};

export default NewCardTemplateTypePage;
