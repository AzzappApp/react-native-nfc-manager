import {
  CardStyleTable,
  CardTemplateTypeTable,
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

  const [cardStyles, template, cardTemplateTypes] = await Promise.all([
    db.select().from(CardStyleTable),
    getCardTemplateById(params.id),
    db.select().from(CardTemplateTypeTable),
  ]);

  return (
    <CardTemplatesForm
      cardStyles={cardStyles}
      cardTemplate={template}
      cardTemplateTypes={cardTemplateTypes}
    />
  );
};

export default CardTemplatePage;
