// @TODO: temporary disable for feat_cover_v2
/* eslint-disable eslint-comments/no-unlimited-disable */
/* eslint-disable */
// @ts-nocheck
import { asc, eq, like, or, sql, and, desc } from 'drizzle-orm';
import { CoverTemplateTable, db } from '@azzapp/data';
import CoverTemplatesList from './CoverTemplatesList';

export type CoverTemplateItem = {
  id: string;
  name: string;
  kind: string;
  personalEnabled: boolean;
  businessEnabled: boolean;
};

export type Status = 'Disabled' | 'Enabled';

export type Filters = {
  personalStatus?: Status | 'All';
  businessStatus?: Status | 'All';
};

const getFilters = (filters: Filters) => {
  const f = [];
  if (filters.personalStatus && filters.personalStatus !== 'All') {
    f.push(
      eq(
        CoverTemplateTable.personalEnabled,
        filters.personalStatus === 'Enabled',
      ),
    );
  }
  if (filters.businessStatus && filters.businessStatus !== 'All') {
    f.push(
      eq(
        CoverTemplateTable.businessEnabled,
        filters.businessStatus === 'Enabled',
      ),
    );
  }

  return f;
};

const getSearch = (search: string | null) => {
  if (search) {
    return or(
      like(CoverTemplateTable.name, `%${search}%`),
      like(CoverTemplateTable.kind, `%${search}%`),
    );
  }
};

export type SortColumn = 'kind' | 'name';

const sortsColumns = {
  name: CoverTemplateTable.name,
  kind: CoverTemplateTable.kind,
};

const getQuery = (search: string | null, filters: Filters) => {
  const query = db
    .select({
      id: CoverTemplateTable.id,
      name: CoverTemplateTable.name,
      kind: CoverTemplateTable.kind,
      personalEnabled: CoverTemplateTable.personalEnabled,
      businessEnabled: CoverTemplateTable.businessEnabled,
    })
    .from(CoverTemplateTable)
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
    ps?: string;
    bs?: string;
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
    personalStatus: (searchParams.ps as Status) || 'All',
    businessStatus: (searchParams.bs as Status) || 'All',
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
