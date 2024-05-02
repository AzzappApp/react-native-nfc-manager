import { asc, desc, like, or, sql, eq, and } from 'drizzle-orm';
import { UserTable, db, ProfileTable } from '@azzapp/data';
import UsersList from './UsersList';
import type { SQLWrapper } from 'drizzle-orm';

export type AccountStatus = 'Active' | 'Suspended';

export type UserTable = {
  id: string;
  email: string | null;
  phoneNumber: string | null;
  webcardsCount: number;
  createdAt: Date;
};

export type Filters = {
  status?: AccountStatus | 'all';
};

const sortsColumns = {
  createdAt: UserTable.createdAt,
  email: UserTable.email,
  phoneNumber: UserTable.phoneNumber,
  webcardsCount: sql`webcardsCount`,
  status: UserTable.deleted,
};

const getFilters = (filters: Filters): SQLWrapper[] => {
  const f: SQLWrapper[] = [];
  if (filters.status && filters.status !== 'all') {
    f.push(eq(UserTable.deleted, filters.status === 'Suspended'));
  }

  return f;
};

const getSearch = (search: string | null) => {
  if (search) {
    return or(
      like(UserTable.email, `%${search}%`),
      like(UserTable.phoneNumber, `%${search}%`),
    );
  }
};

const getQuery = (search: string | null, filters: Filters) => {
  const query = db
    .select({
      id: UserTable.id,
      email: UserTable.email,
      phoneNumber: UserTable.phoneNumber,
      webcardsCount: sql`count(*) as webcardsCount`.mapWith(Number),
      createdAt: UserTable.createdAt,
      status: UserTable.deleted,
    })
    .from(ProfileTable)
    .where(
      and(
        eq(ProfileTable.deleted, false),
        getSearch(search),
        ...getFilters(filters),
      ),
    )
    .groupBy(UserTable.id)
    .innerJoin(UserTable, eq(UserTable.id, ProfileTable.userId))
    .$dynamic();

  return query;
};
const getUsers = (
  page: number,
  sort: 'createdAt' | 'email' | 'phoneNumber' | 'webcardsCount',
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
    .from(subQuery.as('Subquery'));

  return query.then(rows => rows[0].count);
};

type UsersPageProps = {
  searchParams?: {
    page?: string;
    sort?: string;
    order?: string;
    s?: string;
    status?: string;
  };
};

const UsersPage = async ({ searchParams = {} }: UsersPageProps) => {
  let page = searchParams.page ? parseInt(searchParams.page, 10) : 0;
  page = Math.max(isNaN(page) ? 1 : page, 1);

  const sort = Object.keys(sortsColumns).includes(searchParams.sort as any)
    ? (searchParams.sort as any)
    : 'createdAt';

  const order = searchParams.order === 'asc' ? 'asc' : 'desc';
  const search = searchParams.s ?? null;
  const filters: Filters = {
    status: (searchParams.status as AccountStatus) || 'all',
  };
  const users = await getUsers(page - 1, sort, order, search, filters);
  const count = await getCount(search, filters);

  return (
    <UsersList
      users={users}
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

export default UsersPage;

const PAGE_SIZE = 25;
