import {
  CardTemplateTypeTable,
  CompanyActivityTable,
  db,
  getLocalizationMessagesByLocaleAndTarget,
} from '@azzapp/data';
import { DEFAULT_LOCALE, ENTITY_TARGET } from '@azzapp/i18n';
import WebCardCategoryForm from '../WebCardCategoryForm';

const NewWebCardCategoryPage = async () => {
  const companyActivities = await db.select().from(CompanyActivityTable);
  const cardTemplateTypes = await db.select().from(CardTemplateTypeTable);

  const labels = await getLocalizationMessagesByLocaleAndTarget(
    DEFAULT_LOCALE,
    ENTITY_TARGET,
  );
  return (
    <WebCardCategoryForm
      companyActivities={companyActivities}
      cardTemplateTypes={cardTemplateTypes}
      labels={labels}
    />
  );
};

export default NewWebCardCategoryPage;
