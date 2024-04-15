import { and, asc, desc, eq, like, or, sql } from 'drizzle-orm';
import { ColorPaletteTable, db } from '@azzapp/data';
import ColorPalettesList from './ColorPalettesList';
import type { SQLWrapper } from 'drizzle-orm';

export type ColorStatus = 'Disabled' | 'Enabled';
export type SortColumn = 'enabled' | 'id';

export type Filters = {
  status?: ColorStatus | 'all';
};

const sortsColumns = {
  id: ColorPaletteTable.id,
  enabled: ColorPaletteTable.enabled,
};

const getFilters = (filters: Filters): SQLWrapper[] => {
  const f: SQLWrapper[] = [];
  if (filters.status && filters.status !== 'all') {
    f.push(eq(sql`enabled`, filters.status === 'Enabled'));
  }

  return f;
};

const getSearch = (search: string | null) => {
  if (search) {
    return or(like(ColorPaletteTable.id, `%${search}%`));
  }
};

const getColorPalettesQuery = (search: string | null, filters: Filters) => {
  const query = db
    .select()
    .from(ColorPaletteTable)
    .where(and(getSearch(search), ...getFilters(filters)))
    .$dynamic();

  return query;
};

const getColorPalettes = (
  page: number,
  sort: SortColumn,
  order: 'asc' | 'desc',
  search: string | null,
  filters: Filters,
) => {
  const query = getColorPalettesQuery(search, filters);

  query
    .offset(page * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .orderBy(
      order === 'asc' ? asc(sortsColumns[sort]) : desc(sortsColumns[sort]),
    );

  return query;
};

const getCount = async (search: string | null, filters: Filters) => {
  const subQuery = getColorPalettesQuery(search, filters);
  const query = db
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(subQuery.as('Subquery'));

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

const ColorPalettesPage = async ({ searchParams = {} }: Props) => {
  let page = searchParams.page ? parseInt(searchParams.page, 10) : 0;
  page = Math.max(isNaN(page) ? 1 : page, 1);

  const sort = Object.keys(sortsColumns).includes(searchParams.sort as any)
    ? (searchParams.sort as any)
    : 'id';

  const order = searchParams.order === 'desc' ? 'desc' : 'asc';
  const search = searchParams.s ?? null;
  const filters: Filters = {
    status: (searchParams.status as ColorStatus) || 'Enabled',
  };
  const colorsPalettes = await getColorPalettes(
    page - 1,
    sort,
    order,
    search,
    filters,
  );
  const count = await getCount(search, filters);

  return (
    <ColorPalettesList
      colorPalettes={colorsPalettes}
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

export default ColorPalettesPage;

const PAGE_SIZE = 25;
