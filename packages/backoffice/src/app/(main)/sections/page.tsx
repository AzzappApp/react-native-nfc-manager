import { eq, like, or, sql, and, asc, desc } from 'drizzle-orm';
import { CardModuleTable, db } from '@azzapp/data';
import type { CardModule } from '@azzapp/data';

export type Visible = 'Hidden' | 'Visible';
export type Kind = CardModule['kind'];

export type Filters = {
  kind?: Kind;
  visible?: Visible | 'All';
};

const getFilters = (filters: Filters) => {
  const f = [];
  if (filters.visible && filters.visible !== 'All') {
    f.push(eq(CardModuleTable.visible, filters.visible === 'Visible'));
  }
  if (filters.kind) {
    f.push(eq(CardModuleTable.kind, filters.kind));
  }

  return f;
};

const getSearch = (search: string | null) => {
  if (search) {
    return or(
      like(CardModuleTable.kind, `%${search}%`),
      like(CardModuleTable.id, `%${search}%`),
    );
  }
};

export type SortColumn = 'id' | 'kind' | 'position';

const sortsColumns = {
  id: CardModuleTable.id,
  kind: CardModuleTable.kind,
  position: CardModuleTable.position,
};

const getQuery = (search: string | null, filters: Filters) => {
  const query = db
    .select()
    .from(CardModuleTable)
    .where(and(getSearch(search), ...getFilters(filters)))
    .$dynamic();

  return query;
};

const getCardModules = (
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
    k?: string;
    v?: string;
  };
};

const CardTemplatesPage = async ({ searchParams = {} }: Props) => {
  let page = searchParams.page ? parseInt(searchParams.page, 10) : 1;
  page = Math.max(isNaN(page) ? 1 : page, 1);

  const sort = Object.keys(sortsColumns).includes(searchParams.sort as any)
    ? (searchParams.sort as any)
    : 'position';

  const order = searchParams.order === 'asc' ? 'asc' : 'desc';
  const search = searchParams.s ?? null;
  const filters: Filters = {
    kind: (searchParams.s as Kind) || 'blockText',
    visible: (searchParams.s as Visible) || 'All',
  };

  const cardModules = await getCardModules(
    page - 1,
    sort,
    order,
    search,
    filters,
  );
  const count = await getCount(search, filters);
  console.log(cardModules, count);
  return <div>sections</div>;
};

export default CardTemplatesPage;

const PAGE_SIZE = 25;
