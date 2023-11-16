import {
  db,
  getCardTemplateTypeById,
  ProfileCategoryTable,
} from '@azzapp/data/domains';
import CardTemplateTypesForm from '../CardTemplateTypesForm';
type CardTemplatePageProps = {
  params: {
    id: string;
  };
};

const CardTemplatePage = async (props: CardTemplatePageProps) => {
  const { params } = props;

  const template = await getCardTemplateTypeById(params.id);
  const profileCategories = await db.select().from(ProfileCategoryTable);
  return (
    <CardTemplateTypesForm
      cardTemplateType={template}
      profileCategories={profileCategories}
    />
  );
};

export default CardTemplatePage;
