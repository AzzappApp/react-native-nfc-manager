import { asc, desc, or, sql } from 'drizzle-orm';
import { UserTable, db } from '@azzapp/data/domains';
import UsersList from './UsersList';

const sortsColumns = {
  createdAt: UserTable.createdAt,
  email: UserTable.email,
  phoneNumber: UserTable.phoneNumber,
  roles: UserTable.roles,
};

const getUsers = (
  page: number,
  sort: 'createdAt' | 'email' | 'phoneNumber' | 'roles',
  order: 'asc' | 'desc',
  search: string | null,
) => {
  let query = db.select().from(UserTable);

  if (search) {
    query = query.where(
      or(
        sql`email LIKE ${`%${search}%`}`,
        sql`phoneNumber LIKE ${`%${search}%`}`,
      ),
    );
  }
  return query
    .offset(page * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .orderBy(
      order === 'asc' ? asc(sortsColumns[sort]) : desc(sortsColumns[sort]),
    );
};

const getUsersCount = async (search: string | null) => {
  let query = db
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(UserTable);

  if (search) {
    query = query.where(
      or(
        sql`email LIKE ${`%${search}%`}`,
        sql`phoneNumber LIKE ${`%${search}%`}`,
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

  const order =
    searchParams.order === 'desc'
      ? 'desc'
      : sort === 'createdAt' && !searchParams.order
        ? 'desc'
        : 'asc';
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
