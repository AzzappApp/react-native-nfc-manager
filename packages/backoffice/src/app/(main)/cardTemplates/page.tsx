import { CardTemplateTable, db } from '@azzapp/data';
import CardTemplatesList from './CardTemplatesList';

const CardTemplatesPage = async () => {
  const cardTemplates = await db.select().from(CardTemplateTable);
  return <CardTemplatesList cardTemplates={cardTemplates} />;
};

export default CardTemplatesPage;
