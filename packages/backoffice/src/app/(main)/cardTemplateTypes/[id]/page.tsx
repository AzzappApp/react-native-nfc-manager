import {
  db,
  getCardTemplateTypeById,
  getLabel,
  getLabels,
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

  const webCardCategoriesLabels = await getLabels(
    webCardCategories.map(webCardCategory => webCardCategory.labelKey),
  );

  const label = await getLabel(template.labelKey);

  return (
    <CardTemplateTypesForm
      cardTemplateType={template}
      label={label}
      webCardCategories={webCardCategories}
      webCardCategoriesLabels={webCardCategoriesLabels}
    />
  );
};

export default CardTemplatePage;
