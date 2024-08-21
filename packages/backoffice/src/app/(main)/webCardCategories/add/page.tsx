import {
  getCardTemplateTypes,
  getCompanyActivities,
  getLocalizationMessagesByLocaleAndTarget,
} from '@azzapp/data';
import { DEFAULT_LOCALE, ENTITY_TARGET } from '@azzapp/i18n';
import WebCardCategoryForm from '../WebCardCategoryForm';

const NewWebCardCategoryPage = async () => {
  const [companyActivities, cardTemplateTypes, labels] = await Promise.all([
    getCompanyActivities(),
    getCardTemplateTypes(),
    getLocalizationMessagesByLocaleAndTarget(DEFAULT_LOCALE, ENTITY_TARGET),
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
