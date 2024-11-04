import {
  getCardTemplateTypes,
  getCompanyActivityTypes,
  getLocalizationMessagesByLocale,
} from '@azzapp/data';
import { DEFAULT_LOCALE } from '@azzapp/i18n';
import CompanyActivityForm from '../CompanyActivityForm';
const NewCompanyActivityPage = async () => {
  const [cardTemplateTypes, companyActivitiesTypes] = await Promise.all([
    getCardTemplateTypes(true),
    getCompanyActivityTypes(),
  ]);

  const labels = await getLocalizationMessagesByLocale(DEFAULT_LOCALE);
  return (
    <CompanyActivityForm
      cardTemplateTypes={cardTemplateTypes}
      companyActivitiesTypes={companyActivitiesTypes}
      labels={labels}
    />
  );
};

export default NewCompanyActivityPage;
