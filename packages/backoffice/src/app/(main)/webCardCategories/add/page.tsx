import { CardTemplateTypeTable, CompanyActivityTable, db } from '@azzapp/data';
import WebCardCategoryForm from '../WebCardCategoryForm';

const NewWebCardCategoryPage = async () => {
  const companyActivities = await db.select().from(CompanyActivityTable);
  const cardTemplateTypes = await db.select().from(CardTemplateTypeTable);
  return (
    <WebCardCategoryForm
      companyActivities={companyActivities}
      cardTemplateTypes={cardTemplateTypes}
    />
  );
};

export default NewWebCardCategoryPage;
