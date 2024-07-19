import { asc, eq, like, or, sql, and, desc } from 'drizzle-orm';
import { UserSubscriptionTable, db } from '@azzapp/data';
import SubscriptionList from './SubscriptionList';

export type Status = 'active' | 'canceled' | 'waiting_payment';
export type Type = 'web.lifetime' | 'web.monthly' | 'web.yearly';

export type Filters = {
  status?: Status | 'All';
  type?: Type | 'All';
};

const getFilters = (filters: Filters) => {
  const f = [];
  if (filters.status && filters.status !== 'All') {
    f.push(eq(UserSubscriptionTable.status, filters.status));
  }
  if (filters.type && filters.type !== 'All') {
    f.push(eq(UserSubscriptionTable.subscriptionPlan, filters.type));
  }

  return f;
};

const getSearch = (search: string | null) => {
  if (search) {
    return or(
      like(UserSubscriptionTable.userId, `%${search}%`),
      like(UserSubscriptionTable.webCardId, `%${search}%`),
      like(UserSubscriptionTable.issuer, `%${search}%`),
    );
  }
};

export type SortColumn = 'endAt' | 'issuer' | 'status' | 'subscriptionPlan';

const sortsColumns = {
  subscriptionPlan: UserSubscriptionTable.subscriptionPlan,
  issuer: UserSubscriptionTable.issuer,
  endAt: UserSubscriptionTable.endAt,
  status: UserSubscriptionTable.status,
};

const getQuery = (search: string | null, filters: Filters) => {
  const query = db
    .select()
    .from(UserSubscriptionTable)
    .where(and(getSearch(search), ...getFilters(filters)))
    .$dynamic();

  return query;
};

const getSubscriptions = (
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
    t?: string;
  };
};

const CoverTemplatesPage = async ({ searchParams = {} }: Props) => {
  let page = searchParams.page ? parseInt(searchParams.page, 10) : 1;
  page = Math.max(isNaN(page) ? 1 : page, 1);

  const sort = Object.keys(sortsColumns).includes(searchParams.sort as any)
    ? (searchParams.sort as any)
    : 'endAt';

  const order = searchParams.order === 'asc' ? 'asc' : 'desc';
  const search = searchParams.s ?? null;
  const filters: Filters = {
    status: (searchParams.st as Status) || 'All',
    type: (searchParams.t as Type) || 'All',
  };

  const subscriptions = await getSubscriptions(
    page - 1,
    sort,
    order,
    search,
    filters,
  );
  const count = await getCount(search, filters);
  return (
    <SubscriptionList
      subscriptions={subscriptions}
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
