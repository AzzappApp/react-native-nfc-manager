import { eq } from 'drizzle-orm';
import {
  CardStyleTable,
  CardTemplateCompanyActivityTable,
  CardTemplateProfileCategoryTable,
  CompanyActivityTable,
  ProfileCategoryTable,
  db,
  getCardTemplateById,
} from '@azzapp/data/domains';
import CardTemplatesForm from '../CardTemplatesForm';

type CardTemplatePageProps = {
  params: {
    id: string;
  };
};

const CardTemplatePage = async (props: CardTemplatePageProps) => {
  const { params } = props;

  const [
    profileCategories,
    companyActivities,
    cardStyles,
    template,
    templateCategories,
    templateActivities,
  ] = await Promise.all([
    db.select().from(ProfileCategoryTable),
    db.select().from(CompanyActivityTable),
    db.select().from(CardStyleTable),
    getCardTemplateById(params.id),
    db
      .select()
      .from(CardTemplateProfileCategoryTable)
      .where(eq(CardTemplateProfileCategoryTable.cardTemplateId, params.id))
      .then(categories =>
        categories.map(category => category.profileCategoryId),
      ),
    db
      .select()
      .from(CardTemplateCompanyActivityTable)
      .where(eq(CardTemplateCompanyActivityTable.cardTemplateId, params.id))
      .then(activities =>
        activities.map(activity => activity.companyActivityId),
      ),
  ]);

  return (
    <CardTemplatesForm
      profileCategories={profileCategories}
      companyActivities={companyActivities}
      cardStyles={cardStyles}
      cardTemplate={template}
      templateActivities={templateActivities}
      templateCategories={templateCategories}
    />
  );
};

export default CardTemplatePage;
