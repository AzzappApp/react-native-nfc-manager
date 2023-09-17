import { CardTemplateTable, db } from '@azzapp/data/domains';
import CardTemplatesList from './CardTemplatesList';

const CardTemplatesPage = async () => {
  const cardTemplates = await db.select().from(CardTemplateTable);
  return <CardTemplatesList cardTemplates={cardTemplates} />;
};

export default CardTemplatesPage;
