import {
  db,
  getCardTemplateTypeById,
  getLocalizationMessagesByLocaleAndTarget,
  WebCardCategoryTable,
} from '@azzapp/data';
import { DEFAULT_LOCALE, ENTITY_TARGET } from '@azzapp/i18n';
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

  const labels = await getLocalizationMessagesByLocaleAndTarget(
    DEFAULT_LOCALE,
    ENTITY_TARGET,
  );

  return (
    <CardTemplateTypesForm
      cardTemplateType={template}
      webCardCategories={webCardCategories}
      labels={labels}
    />
  );
};

export default CardTemplatePage;
