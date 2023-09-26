import {
  CardStyleTable,
  CardTemplateTypeTable,
  db,
} from '@azzapp/data/domains';
import CardTemplatesForm from '../CardTemplatesForm';

const NewCardTemplatePage = async () => {
  const cardStyles = await db.select().from(CardStyleTable);
  const cardTemplateTypes = await db.select().from(CardTemplateTypeTable);
  return (
    <CardTemplatesForm
      cardStyles={cardStyles}
      cardTemplateTypes={cardTemplateTypes}
    />
  );
};

export default NewCardTemplatePage;
