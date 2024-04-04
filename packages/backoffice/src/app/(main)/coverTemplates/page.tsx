import { asc } from 'drizzle-orm';
import { CoverTemplateTable, db } from '@azzapp/data';
import CoverTemplatesList from './CoverTemplatesList';

const CoverTemplatesPage = async () => {
  const CoverTemplates = await db
    .select()
    .from(CoverTemplateTable)
    .orderBy(asc(CoverTemplateTable.name));
  return (
    <CoverTemplatesList coverTemplates={CoverTemplates} pageSize={PAGE_SIZE} />
  );
};

export default CoverTemplatesPage;

const PAGE_SIZE = 100;
