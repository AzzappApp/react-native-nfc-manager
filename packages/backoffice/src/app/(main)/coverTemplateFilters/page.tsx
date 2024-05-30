import { and, asc, desc, eq, like, or, sql } from 'drizzle-orm';
import { CoverTemplateTable, CoverTemplateTagTable, db } from '@azzapp/data';
import CoverTemplateTypesList from './CoverTemplateTagsList';
import type { SQLWrapper } from 'drizzle-orm';

export type Filters = {
  enabled?: string | null;
};

const sortsColumns = {
  labelKey: CoverTemplateTagTable.labelKey,
  order: CoverTemplateTagTable.order,
  enabled: CoverTemplateTagTable.enabled,
};

const getFilters = (filters: Filters): SQLWrapper[] => {
  const f: SQLWrapper[] = [];
  if (filters.enabled && filters.enabled !== 'all') {
    f.push(eq(CoverTemplateTagTable.enabled, filters.enabled === 'true'));
  }

  return f;
};

const getSearch = (search: string | null) => {
  if (search) {
    return or(
      like(CoverTemplateTagTable.labelKey, `%${search}%`),
      like(CoverTemplateTagTable.order, `%${search}%`),
    );
  }
};

const getCoverTemplateTags = (
  page: number,
  sort: 'enabled' | 'labelKey' | 'order',
  order: 'asc' | 'desc',
  search: string | null,
  filters: Filters,
) => {
  const query = db
    .select()
    .from(CoverTemplateTagTable)
    .orderBy(asc(CoverTemplateTagTable.order))
    .where(and(getSearch(search), ...getFilters(filters)))
    .$dynamic();

  query
    .offset(page * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .orderBy(
      order === 'asc' ? asc(sortsColumns[sort]) : desc(sortsColumns[sort]),
    );

  return query;
};

const getCoverTemplateTagsCount = async (
  search: string | null,
  filters: Filters,
) => {
  const query = db
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(CoverTemplateTagTable)
    .orderBy(asc(CoverTemplateTagTable.order))
    .where(and(getSearch(search), ...getFilters(filters)));

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

const CoverTemplateTagsPage = async ({ searchParams = {} }: Props) => {
  let page = searchParams.page ? parseInt(searchParams.page, 10) : 1;
  page = Math.max(isNaN(page) ? 1 : page, 1);

  const sort = Object.keys(sortsColumns).includes(searchParams.sort as any)
    ? (searchParams.sort as any)
    : 'order';

  const order = searchParams.order === 'desc' ? 'desc' : 'asc';
  const search = searchParams.s ?? null;
  const filters: Filters = {
    enabled: searchParams.status ?? 'all',
  };

  const coverTemplateTags = await getCoverTemplateTags(
    page - 1,
    sort,
    order,
    search,
    filters,
  );

  const templatesCounts = await Promise.all(
    coverTemplateTags.map(coverTemplateTag => {
      return db
        .select({ count: sql`count(*)`.mapWith(Number) })
        .from(CoverTemplateTable)
        .where(eq(CoverTemplateTable.type, coverTemplateTag.id))
        .then(res => res[0].count);
    }),
  );

  const count = await getCoverTemplateTagsCount(search, filters);

  return (
    <CoverTemplateTypesList
      search={null}
      count={count}
      coverTemplateTags={coverTemplateTags.map((coverTemplateType, i) => ({
        ...coverTemplateType,
        templates: templatesCounts[i],
      }))}
      page={page}
      pageSize={PAGE_SIZE}
      sortField={sort}
      sortOrder={order}
    />
  );
};

const PAGE_SIZE = 25;

export default CoverTemplateTagsPage;
