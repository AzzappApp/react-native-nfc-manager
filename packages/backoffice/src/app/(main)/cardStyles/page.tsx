import { like, or, asc, desc, sql } from 'drizzle-orm';
import { CardStyleTable, db } from '@azzapp/data';
import CardStylesList from './CardStylesList';

export type SortColumn = 'labelKey';

const sortsColumns = {
  labelKey: CardStyleTable.labelKey,
};

const getCardStylesQuery = (search: string | null) => {
  let query = db.select().from(CardStyleTable).$dynamic();

  if (search) {
    query = query.where(or(like(CardStyleTable.labelKey, `%${search}%`)));
  }

  return query;
};

const getCardStyles = (
  page: number,
  sort: SortColumn,
  order: 'asc' | 'desc',
  search: string | null,
) => {
  const query = getCardStylesQuery(search);

  query
    .offset(page * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .orderBy(
      order === 'asc' ? asc(sortsColumns[sort]) : desc(sortsColumns[sort]),
    );

  return query;
};

const getCount = async (search: string | null) => {
  const subQuery = getCardStylesQuery(search);
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
  };
};

const CardStylesPage = async ({ searchParams = {} }: Props) => {
  let page = searchParams.page ? parseInt(searchParams.page, 10) : 0;
  page = Math.max(isNaN(page) ? 1 : page, 1);

  const sort = Object.keys(sortsColumns).includes(searchParams.sort as any)
    ? (searchParams.sort as any)
    : 'labelKey';

  const order = searchParams.order === 'desc' ? 'desc' : 'asc';
  const search = searchParams.s ?? null;
  const cardStyles = await getCardStyles(page - 1, sort, order, search);
  const count = await getCount(search);

  return (
    <CardStylesList
      cardStyles={cardStyles}
      count={count}
      page={page}
      pageSize={PAGE_SIZE}
      sortField={sort}
      sortOrder={order}
      search={search}
    />
  );
};

export default CardStylesPage;

const PAGE_SIZE = 25;
