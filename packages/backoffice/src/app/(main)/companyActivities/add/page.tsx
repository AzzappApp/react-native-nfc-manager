import {
  getCardTemplateTypes,
  getCompanyActivityTypes,
  getLocalizationMessagesByLocaleAndTarget,
} from '@azzapp/data';
import { DEFAULT_LOCALE, ENTITY_TARGET } from '@azzapp/i18n';
import CompanyActivityForm from '../CompanyActivityForm';
const NewCompanyActivityPage = async () => {
  const [cardTemplateTypes, companyActivitiesTypes] = await Promise.all([
    getCardTemplateTypes(true),
    getCompanyActivityTypes(),
  ]);

  const labels = await getLocalizationMessagesByLocaleAndTarget(
    DEFAULT_LOCALE,
    ENTITY_TARGET,
  );
  return (
    <CompanyActivityForm
      cardTemplateTypes={cardTemplateTypes}
      companyActivitiesTypes={companyActivitiesTypes}
      labels={labels}
    />
  );
};

export default NewCompanyActivityPage;
