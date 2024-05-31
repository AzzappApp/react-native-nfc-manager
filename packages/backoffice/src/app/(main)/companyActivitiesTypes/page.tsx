import { asc, desc, like, or, sql } from 'drizzle-orm';
import { CompanyActivityTypeTable, db } from '@azzapp/data';
import CompanyActivitiesTypesList from './CompanyActivitiesTypesList';

const sortsColumns = {
  labelKey: CompanyActivityTypeTable.labelKey,
};

export type SortColumn = keyof typeof sortsColumns;

const getActivitiesTypesQuery = (search: string | null) => {
  let query = db.select().from(CompanyActivityTypeTable).$dynamic();

  if (search) {
    query = query.where(
      or(like(CompanyActivityTypeTable.labelKey, `%${search}%`)),
    );
  }

  return query;
};

const getActivitiesTypes = (
  page: number,
  sort: SortColumn,
  order: 'asc' | 'desc',
  search: string | null,
) => {
  const query = getActivitiesTypesQuery(search);

  query
    .offset(page * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .orderBy(
      order === 'asc' ? asc(sortsColumns[sort]) : desc(sortsColumns[sort]),
    );

  return query;
};

const countActivitiesTypes = async (search: string | null) => {
  const subQuery = getActivitiesTypesQuery(search);
  const query = db
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(subQuery.as('ActivitiesTypes'));

  return query.then(rows => rows[0].count);
};

type Props = {
  searchParams?: {
    page?: string;
    sort?: string;
    order?: string;
    s?: string;
  };
};

const CompanyActivitiesTypesPage = async ({ searchParams = {} }: Props) => {
  let page = searchParams.page ? parseInt(searchParams.page, 10) : 0;
  page = Math.max(isNaN(page) ? 1 : page, 1);

  const sort = Object.keys(sortsColumns).includes(searchParams.sort as any)
    ? (searchParams.sort as any)
    : 'labelKey';

  const order = searchParams.order === 'desc' ? 'desc' : 'asc';
  const search = searchParams.s ?? null;
  const companyActivitiesTypes = await getActivitiesTypes(
    page - 1,
    sort,
    order,
    search,
  );
  const count = await countActivitiesTypes(search);

  return (
    <CompanyActivitiesTypesList
      companyActivitiesTypes={companyActivitiesTypes}
      count={count}
      page={page}
      pageSize={PAGE_SIZE}
      sortField={sort}
      sortOrder={order}
      search={search}
    />
  );
};

export default CompanyActivitiesTypesPage;

const PAGE_SIZE = 25;
