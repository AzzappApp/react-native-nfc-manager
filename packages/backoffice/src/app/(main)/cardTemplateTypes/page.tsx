import { and, asc, desc, eq, like, or, sql } from 'drizzle-orm';
import {
  CardTemplateTable,
  CardTemplateTypeTable,
  WebCardCategoryTable,
  db,
} from '@azzapp/data';
import CardTemplateTypesList from './CardTemplateTypesList';

export type CardTemplateTypeItem = {
  id: string;
  labelKey: string;
  category: string;
  status: boolean;
  templates: number;
};

export type Status = 'Disabled' | 'Enabled';

export type Filters = {
  status?: Status | 'All';
};

const getFilters = (filters: Filters) => {
  const f = [];
  if (filters.status && filters.status !== 'All') {
    f.push(eq(CardTemplateTypeTable.enabled, filters.status === 'Enabled'));
  }

  return f;
};

const getSearch = (search: string | null) => {
  if (search) {
    return or(
      like(CardTemplateTypeTable.labelKey, `%${search}%`),
      like(WebCardCategoryTable.labelKey, `%${search}%`),
    );
  }
};

export type SortColumn = 'category' | 'labelKey';

const sortsColumns = {
  labelKey: CardTemplateTypeTable.labelKey,
  category: sql`category`,
  status: CardTemplateTypeTable.enabled,
  templates: sql`templates`,
};

const getQuery = (search: string | null, filters: Filters) => {
  const query = db
    .select({
      id: CardTemplateTypeTable.id,
      labelKey: CardTemplateTypeTable.labelKey,
      category: sql`${WebCardCategoryTable.labelKey}`
        .mapWith(String)
        .as('category'),
      status: CardTemplateTypeTable.enabled,
      templates: sql`count(*)`.mapWith(Number).as('templates'),
    })
    .from(CardTemplateTypeTable)
    .innerJoin(
      WebCardCategoryTable,
      eq(CardTemplateTypeTable.webCardCategoryId, WebCardCategoryTable.id),
    )
    .leftJoin(
      CardTemplateTable,
      eq(CardTemplateTable.cardTemplateTypeId, CardTemplateTypeTable.id),
    )
    .groupBy(CardTemplateTypeTable.id, WebCardCategoryTable.labelKey)
    .where(and(getSearch(search), ...getFilters(filters)))
    .$dynamic();

  return query;
};

const getCardTemplateTypes = (
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
    status?: string;
  };
};

const CardTemplateTypesPage = async ({ searchParams = {} }: Props) => {
  let page = searchParams.page ? parseInt(searchParams.page, 10) : 1;
  page = Math.max(isNaN(page) ? 1 : page, 1);

  const sort = Object.keys(sortsColumns).includes(searchParams.sort as any)
    ? (searchParams.sort as any)
    : 'labelKey';

  const order = searchParams.order === 'desc' ? 'desc' : 'asc';
  const search = searchParams.s ?? null;
  const filters: Filters = {
    status: (searchParams.status as Status) || 'All',
  };

  const cardTemplateTypes = await getCardTemplateTypes(
    page - 1,
    sort,
    order,
    search,
    filters,
  );
  const count = await getCount(search, filters);
  return (
    <CardTemplateTypesList
      cardTemplateTypes={cardTemplateTypes}
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

export default CardTemplateTypesPage;

const PAGE_SIZE = 25;
