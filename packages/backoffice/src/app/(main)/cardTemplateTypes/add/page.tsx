import {
  getLocalizationMessagesByLocale,
  getWebCardCategories,
} from '@azzapp/data';
import { DEFAULT_LOCALE } from '@azzapp/i18n';
import CardTemplateTypesForm from '../CardTemplateTypesForm';
const NewCardTemplateTypePage = async () => {
  const [webCardCategories, labels] = await Promise.all([
    getWebCardCategories(),
    getLocalizationMessagesByLocale(DEFAULT_LOCALE),
  ]);

  return (
    <CardTemplateTypesForm
      webCardCategories={webCardCategories}
      labels={labels}
    />
  );
};

export default NewCardTemplateTypePage;
