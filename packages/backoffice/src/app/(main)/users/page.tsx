import { asc, desc, like, or, sql, eq, and } from 'drizzle-orm';
import { UserTable, db, ProfileTable } from '@azzapp/data';
import UsersList from './UsersList';

export type UserTable = {
  id: string;
  email: string | null;
  phoneNumber: string | null;
  webcardsCount: number;
  createdAt: Date;
};

const sortsColumns = {
  createdAt: UserTable.createdAt,
  email: UserTable.email,
  phoneNumber: UserTable.phoneNumber,
  webcardsCount: sql`webcardsCount`,
};

const getUsers = (
  page: number,
  sort: 'createdAt' | 'email' | 'phoneNumber' | 'webcardsCount',
  order: 'asc' | 'desc',
  search: string | null,
) => {
  let query = db
    .select({
      id: UserTable.id,
      email: UserTable.email,
      phoneNumber: UserTable.phoneNumber,
      webcardsCount: sql`count(*) as webcardsCount`.mapWith(Number),
      createdAt: UserTable.createdAt,
    })
    .from(ProfileTable)
    .where(eq(ProfileTable.deleted, false))
    .groupBy(UserTable.id)
    .innerJoin(UserTable, eq(UserTable.id, ProfileTable.userId))
    .$dynamic();

  if (search) {
    query = query.where(
      and(
        eq(ProfileTable.deleted, false),
        or(
          like(UserTable.email, `%${search}%`),
          like(UserTable.phoneNumber, `%${search}%`),
        ),
      ),
    );
  }
  query
    .offset(page * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .orderBy(
      order === 'asc' ? asc(sortsColumns[sort]) : desc(sortsColumns[sort]),
    );

  return query;
};

const getUsersCount = async (search: string | null) => {
  let query = db
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(UserTable)
    .$dynamic();

  if (search) {
    query = query.where(
      or(
        like(UserTable.email, `%${search}%`),
        like(UserTable.phoneNumber, `%${search}%`),
      ),
    );
  }
  return query.then(rows => rows[0].count);
};

type UsersPageProps = {
  searchParams?: {
    page?: string;
    sort?: string;
    order?: string;
    s?: string;
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
  const users = await getUsers(page - 1, sort, order, search);
  const count = await getUsersCount(search);

  return (
    <UsersList
      users={users}
      count={count}
      page={page}
      pageSize={PAGE_SIZE}
      sortField={sort}
      sortOrder={order}
      search={search}
    />
  );
};

export default UsersPage;

const PAGE_SIZE = 25;
