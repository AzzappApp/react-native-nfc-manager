import {
  getCardTemplateTypes,
  getCompanyActivities,
  getLocalizationMessagesByLocale,
} from '@azzapp/data';
import { DEFAULT_LOCALE } from '@azzapp/i18n';
import WebCardCategoryForm from '../WebCardCategoryForm';

const NewWebCardCategoryPage = async () => {
  const [companyActivities, cardTemplateTypes, labels] = await Promise.all([
    getCompanyActivities(),
    getCardTemplateTypes(),
    getLocalizationMessagesByLocale(DEFAULT_LOCALE),
  ]);
  return (
    <WebCardCategoryForm
      companyActivities={companyActivities}
      cardTemplateTypes={cardTemplateTypes}
      labels={labels}
    />
  );
};

export default NewWebCardCategoryPage;
