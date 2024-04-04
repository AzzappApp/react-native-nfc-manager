import { CardStyleTable, db } from '@azzapp/data';
import CardStylesList from './CardStylesList';

const CardStylesPage = async () => {
  const cardStyles = await db.select().from(CardStyleTable);

  return <CardStylesList cardStyles={cardStyles} pageSize={PAGE_SIZE} />;
};

export default CardStylesPage;

const PAGE_SIZE = 25;
