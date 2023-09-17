import { CompanyActivityTable, db } from '@azzapp/data/domains';
import ProfileCategoryForm from '../ProfileCategoryForm';

const NewProfileCategoryPage = async () => {
  const companyActivities = await db.select().from(CompanyActivityTable);

  return <ProfileCategoryForm companyActivities={companyActivities} />;
};

export default NewProfileCategoryPage;
