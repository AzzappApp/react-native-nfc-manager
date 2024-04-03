import {
  db,
  getCardTemplateTypeById,
  WebCardCategoryTable,
} from '@azzapp/data';
import CardTemplateTypesForm from '../CardTemplateTypesForm';
type CardTemplatePageProps = {
  params: {
    id: string;
  };
};

const CardTemplatePage = async (props: CardTemplatePageProps) => {
  const { params } = props;

  const template = await getCardTemplateTypeById(params.id);
  const webCardCategories = await db.select().from(WebCardCategoryTable);
  return (
    <CardTemplateTypesForm
      cardTemplateType={template}
      webCardCategories={webCardCategories}
    />
  );
};

export default CardTemplatePage;
