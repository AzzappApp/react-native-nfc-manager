import { CardTemplateTable, db } from '@azzapp/data';
import CardTemplatesList from './CardTemplatesList';

const CardTemplatesPage = async () => {
  const cardTemplates = await db.select().from(CardTemplateTable);
  return (
    <CardTemplatesList cardTemplates={cardTemplates} pageSize={PAGE_SIZE} />
  );
};

export default CardTemplatesPage;

const PAGE_SIZE = 100;
