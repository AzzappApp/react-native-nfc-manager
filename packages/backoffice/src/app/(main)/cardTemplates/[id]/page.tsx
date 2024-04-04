import {
  CardStyleTable,
  CardTemplateTypeTable,
  db,
  getCardTemplateById,
  getLabel,
  getLabels,
} from '@azzapp/data';
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

  const cardStylesLabelKeys = cardStyles.map(cardStyles => cardStyles.labelKey);

  const labels = await getLabels(
    cardStylesLabelKeys.concat(
      cardTemplateTypes.map(cardTemplateType => cardTemplateType.labelKey),
    ),
  );

  const label = await getLabel(template.labelKey);

  return (
    <CardTemplatesForm
      cardStyles={cardStyles}
      cardTemplate={template}
      cardTemplateTypes={cardTemplateTypes}
      labels={labels}
      label={label}
    />
  );
};

export default CardTemplatePage;
