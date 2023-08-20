import {
  CardStyleTable,
  CompanyActivityTable,
  ProfileCategoryTable,
  db,
} from '@azzapp/data/domains';
import CardTemplatesForm from '../CardTemplatesForm';

const NewCardTemplatePage = async () => {
  const profileCategories = await db.select().from(ProfileCategoryTable);
  const companyActivities = await db.select().from(CompanyActivityTable);
  const cardStyles = await db.select().from(CardStyleTable);

  return (
    <CardTemplatesForm
      profileCategories={profileCategories}
      companyActivities={companyActivities}
      cardStyles={cardStyles}
    />
  );
};

export default NewCardTemplatePage;
