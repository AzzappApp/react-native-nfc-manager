import {
  CardTemplateTypeTable,
  CompanyActivityTable,
  db,
} from '@azzapp/data/domains';
import ProfileCategoryForm from '../ProfileCategoryForm';

const NewProfileCategoryPage = async () => {
  const companyActivities = await db.select().from(CompanyActivityTable);
  const cardTemplateTypes = await db.select().from(CardTemplateTypeTable);
  return (
    <ProfileCategoryForm
      companyActivities={companyActivities}
      cardTemplateTypes={cardTemplateTypes}
    />
  );
};

export default NewProfileCategoryPage;
