import { asc } from 'drizzle-orm';
import { CoverTemplateTable, db } from '@azzapp/data/domains';
import CoverTemplatesList from './CoverTemplatesList';

const CoverTemplatesPage = async () => {
  const CoverTemplates = await db
    .select()
    .from(CoverTemplateTable)
    .orderBy(asc(CoverTemplateTable.name));
  return <CoverTemplatesList coverTemplates={CoverTemplates} />;
};

export default CoverTemplatesPage;
