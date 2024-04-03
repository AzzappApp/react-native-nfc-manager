import { asc } from 'drizzle-orm';
import { StaticMediaTable, db } from '@azzapp/data';
import StaticMediasList from './StaticMediasList';

const StaticMediasPage = async () => {
  const staticMedias = await db
    .select()
    .from(StaticMediaTable)
    .orderBy(asc(StaticMediaTable.order));

  return <StaticMediasList staticMedias={staticMedias} />;
};

export default StaticMediasPage;
