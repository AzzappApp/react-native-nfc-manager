import { getLocalizationMessagesByLocale } from '@azzapp/data';
import { DEFAULT_LOCALE } from '@azzapp/i18n';
import CardTemplateTypesForm from '../CardTemplateTypesForm';
const NewCardTemplateTypePage = async () => {
  const [labels] = await Promise.all([
    getLocalizationMessagesByLocale(DEFAULT_LOCALE),
  ]);

  return <CardTemplateTypesForm labels={labels} />;
};

export default NewCardTemplateTypePage;
