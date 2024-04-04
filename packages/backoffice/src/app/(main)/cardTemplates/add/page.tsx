import {
  CardStyleTable,
  CardTemplateTypeTable,
  db,
  getLabels,
} from '@azzapp/data';
import CardTemplatesForm from '../CardTemplatesForm';

const NewCardTemplatePage = async () => {
  const cardStyles = await db.select().from(CardStyleTable);
  const cardTemplateTypes = await db.select().from(CardTemplateTypeTable);

  const labels = await getLabels(
    cardStyles
      .map(cardStyle => cardStyle.labelKey)
      .concat(
        cardTemplateTypes.map(cardTemplateType => cardTemplateType.labelKey),
      ),
  );

  return (
    <CardTemplatesForm
      cardStyles={cardStyles}
      cardTemplateTypes={cardTemplateTypes}
      labels={labels}
    />
  );
};

export default NewCardTemplatePage;
