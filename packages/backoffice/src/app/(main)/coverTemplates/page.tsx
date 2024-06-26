import { asc, like, or, sql, and, desc, eq } from 'drizzle-orm';
import {
  CoverTemplateTable,
  CoverTemplateTypeTable,
  LabelTable,
  db,
} from '@azzapp/data';
import CoverTemplatesList from './CoverTemplatesList';
import type { SQL } from 'drizzle-orm';

export type Status = 'Disabled' | 'Enabled';
export type CoverTemplateItem = {
  id: string;
  name: string;
  type: string;
  status: boolean;
};

export type Filters = {
  status?: Status | 'All';
};

const getFilters = (filters: Filters) => {
  const f: Array<SQL<unknown>> = [];

  if (filters.status && filters.status !== 'All') {
    f.push(eq(CoverTemplateTable.enabled, filters.status === 'Enabled'));
  }

  return f;
};

const getSearch = (search: string | null) => {
  if (search) {
    return or(
      like(CoverTemplateTable.name, `%${search}%`),
      like(LabelTable.baseLabelValue, `%${search}%`),
    );
  }
};

export type SortColumn = 'name' | 'type';

const sortsColumns = {
  name: CoverTemplateTable.name,
  type: LabelTable.baseLabelValue,
};

const getQuery = (search: string | null, filters: Filters) => {
  const query = db
    .select({
      id: CoverTemplateTable.id,
      name: CoverTemplateTable.name,
      type: LabelTable.baseLabelValue,
      status: CoverTemplateTable.enabled,
    })
    .from(CoverTemplateTable)
    .innerJoin(
      CoverTemplateTypeTable,
      eq(CoverTemplateTypeTable.id, CoverTemplateTable.typeId),
    )
    .innerJoin(
      LabelTable,
      eq(CoverTemplateTypeTable.labelKey, LabelTable.labelKey),
    )
    .where(and(getSearch(search), ...getFilters(filters)))
    .$dynamic();

  return query;
};

const getCoverTemplates = (
  page: number,
  sort: SortColumn,
  order: 'asc' | 'desc',
  search: string | null,
  filters: Filters,
) => {
  const query = getQuery(search, filters);

  query
    .offset(page * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .orderBy(
      order === 'asc' ? asc(sortsColumns[sort]) : desc(sortsColumns[sort]),
    );

  return query;
};

const getCount = async (search: string | null, filters: Filters) => {
  const subQuery = getQuery(search, filters);
  const query = db
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(subQuery.as('subQuery'));

  return query.then(rows => rows[0].count);
};

type Props = {
  searchParams?: {
    page?: string;
    sort?: string;
    order?: string;
    s?: string;
    st?: string;
  };
};

const CoverTemplatesPage = async ({ searchParams = {} }: Props) => {
  let page = searchParams.page ? parseInt(searchParams.page, 10) : 1;
  page = Math.max(isNaN(page) ? 1 : page, 1);

  const sort = Object.keys(sortsColumns).includes(searchParams.sort as any)
    ? (searchParams.sort as any)
    : 'name';

  const order = searchParams.order === 'desc' ? 'desc' : 'asc';
  const search = searchParams.s ?? null;
  const filters: Filters = {
    status: (searchParams.st as Status) || 'All',
  };

  const CoverTemplates = await getCoverTemplates(
    page - 1,
    sort,
    order,
    search,
    filters,
  );
  const count = await getCount(search, filters);
  return (
    <CoverTemplatesList
      coverTemplates={CoverTemplates}
      count={count}
      page={page}
      pageSize={PAGE_SIZE}
      sortField={sort}
      sortOrder={order}
      search={search}
      filters={filters}
    />
  );
};

export default CoverTemplatesPage;

const PAGE_SIZE = 100;
