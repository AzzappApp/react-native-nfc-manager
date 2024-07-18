import {
  CardTemplateTypeTable,
  CompanyActivityTypeTable,
  db,
  getLocalizationMessagesByLocaleAndTarget,
} from '@azzapp/data';
import { DEFAULT_LOCALE, ENTITY_TARGET } from '@azzapp/i18n';
import CompanyActivityForm from '../CompanyActivityForm';
const NewCompanyActivityPage = async () => {
  const cardTemplateTypes = await db.select().from(CardTemplateTypeTable);

  const companyActivitiesTypes = await db
    .select()
    .from(CompanyActivityTypeTable);

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
