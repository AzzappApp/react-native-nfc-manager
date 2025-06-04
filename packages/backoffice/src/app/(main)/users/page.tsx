import { getUsersInfos } from '@azzapp/data';
import UsersList from './UsersList';

export type UserTable = {
  id: string;
  email: string | null;
  phoneNumber: string | null;
  webCardsCount: number;
  createdAt: Date;
};

const sortsColumns = [
  'createdAt',
  'email',
  'phoneNumber',
  'webCardsCount',
  'status',
] as const;

export type SortField = (typeof sortsColumns)[number];

type UsersPageProps = {
  searchParams?: Promise<{
    page?: string;
    sort?: string;
    order?: string;
    s?: string;
    status?: string;
  }>;
};

const UsersPage = async (props: UsersPageProps) => {
  const searchParams = await props.searchParams;
  let page = searchParams?.page ? parseInt(searchParams?.page, 10) : 0;
  page = Math.max(isNaN(page) ? 1 : page, 1);

  const sortField =
    searchParams?.sort && sortsColumns.includes(searchParams?.sort as any)
      ? (searchParams?.sort as SortField)
      : 'createdAt';

  const sortOrder = searchParams?.order === 'asc' ? 'asc' : 'desc';
  const search = searchParams?.s ?? null;
  const enabledFilter =
    searchParams?.status === 'Active'
      ? true
      : searchParams?.status === 'Suspended'
        ? false
        : undefined;
  const { users, count } = await getUsersInfos({
    offset: (page - 1) * PAGE_SIZE,
    limit: PAGE_SIZE,
    sortField,
    sortOrder,
    search,
    enabled: enabledFilter,
  });
  return (
    <UsersList
      users={users}
      count={count}
      page={page}
      pageSize={PAGE_SIZE}
      sortField={sortField}
      sortOrder={sortOrder}
      search={search}
      enabledFilter={enabledFilter}
    />
  );
};

export default UsersPage;

const PAGE_SIZE = 25;
