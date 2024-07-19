import {
  CardStyleTable,
  CardTemplateTypeTable,
  db,
  getCardTemplateById,
  getLocalizationMessagesByLocaleAndTarget,
} from '@azzapp/data';
import { DEFAULT_LOCALE, ENTITY_TARGET } from '@azzapp/i18n';
import CardTemplatesForm from '../CardTemplatesForm';

type CardTemplatePageProps = {
  params: {
    id: string;
  };
};

const CardTemplatePage = async (props: CardTemplatePageProps) => {
  const { params } = props;

  const [cardStyles, template, cardTemplateTypes] = await Promise.all([
    db.select().from(CardStyleTable),
    getCardTemplateById(params.id),
    db.select().from(CardTemplateTypeTable),
  ]);

  const labels = await getLocalizationMessagesByLocaleAndTarget(
    DEFAULT_LOCALE,
    ENTITY_TARGET,
  );

  return (
    <CardTemplatesForm
      cardStyles={cardStyles}
      cardTemplate={template}
      cardTemplateTypes={cardTemplateTypes}
      labels={labels}
    />
  );
};

export default CardTemplatePage;
