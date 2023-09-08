import { CardStyleTable, db } from '@azzapp/data/domains';
import CardStylesList from './CardStylesList';

const CardStylesPage = async () => {
  const cardStyles = await db.select().from(CardStyleTable);

  return <CardStylesList cardStyles={cardStyles} />;
};

export default CardStylesPage;
