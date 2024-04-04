import {
  CardTemplateTypeTable,
  CompanyActivityTable,
  db,
  getLabels,
} from '@azzapp/data';
import WebCardCategoryForm from '../WebCardCategoryForm';

const NewWebCardCategoryPage = async () => {
  const companyActivities = await db.select().from(CompanyActivityTable);
  const cardTemplateTypes = await db.select().from(CardTemplateTypeTable);

  const labels = await getLabels(
    cardTemplateTypes
      .map(({ labelKey }) => labelKey)
      .concat(companyActivities.map(({ labelKey }) => labelKey)),
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
