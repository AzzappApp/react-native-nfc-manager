import { CardTemplateTypeTable, db } from '@azzapp/data';
import CardTemplateTypesList from './CardTemplateTypesList';

const CardTemplateTypesPage = async () => {
  const cardTemplateTypes = await db.select().from(CardTemplateTypeTable);
  return (
    <CardTemplateTypesList
      cardTemplateTypes={cardTemplateTypes}
      pageSize={PAGE_SIZE}
    />
  );
};

export default CardTemplateTypesPage;

const PAGE_SIZE = 25;
