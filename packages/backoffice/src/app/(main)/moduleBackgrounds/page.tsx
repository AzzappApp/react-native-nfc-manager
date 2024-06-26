import { asc } from 'drizzle-orm';
import { ModuleBackgroundTable, db } from '@azzapp/data';
import ModuleBackgroundsList from './ModuleBackgroundsList';

const ModuleBackgroundsPage = async () => {
  const moduleBackgrounds = await db
    .select()
    .from(ModuleBackgroundTable)
    .orderBy(asc(ModuleBackgroundTable.order));

  return <ModuleBackgroundsList moduleBackgrounds={moduleBackgrounds} />;
};

export default ModuleBackgroundsPage;
