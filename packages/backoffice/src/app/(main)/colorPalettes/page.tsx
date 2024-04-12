import { and, asc, desc, eq, sql } from 'drizzle-orm';
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

const getColorPalettesQuery = () => {
  const query = db.select().from(ColorPaletteTable).$dynamic();

  return query;
};

const getColorPalettes = (
  page: number,
  sort: SortColumn,
  order: 'asc' | 'desc',
  filters: Filters,
) => {
  const subQuery = getColorPalettesQuery();
  const query = db
    .select()
    .from(subQuery.as('Subquery'))
    .where(and(...getFilters(filters)));

  query
    .offset(page * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .orderBy(
      order === 'asc' ? asc(sortsColumns[sort]) : desc(sortsColumns[sort]),
    );

  return query;
};

const getCount = async (filters: Filters) => {
  const subQuery = getColorPalettesQuery();
  const query = db
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(subQuery.as('Subquery'))
    .where(and(...getFilters(filters)));

  return query.then(rows => rows[0].count);
};

type Props = {
  searchParams?: {
    page?: string;
    sort?: string;
    order?: string;
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
  const filters: Filters = {
    status: (searchParams.status as ColorStatus) || 'Enabled',
  };
  const colorsPalettes = await getColorPalettes(page - 1, sort, order, filters);
  const count = await getCount(filters);

  return (
    <ColorPalettesList
      colorPalettes={colorsPalettes}
      count={count}
      page={page}
      pageSize={PAGE_SIZE}
      sortField={sort}
      sortOrder={order}
      filters={filters}
    />
  );
};

export default ColorPalettesPage;

const PAGE_SIZE = 25;
