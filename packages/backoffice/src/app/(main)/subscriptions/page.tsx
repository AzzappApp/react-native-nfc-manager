import { getSubscriptionsPaged } from '@azzapp/data';
import SubscriptionList from './SubscriptionList';

const statusFilters = ['active', 'canceled', 'waiting_payment'] as const;
export type Status = (typeof statusFilters)[number];
const typesFilters = ['web.lifetime', 'web.monthly', 'web.yearly'] as const;
export type Type = (typeof typesFilters)[number];
const sortsColumns = ['endAt', 'issuer', 'status', 'subscriptionPlan'] as const;
export type SortColumn = (typeof sortsColumns)[number];

type SubscriptionPageProps = {
  searchParams?: {
    page?: string;
    sort?: string;
    order?: string;
    s?: string;
    st?: string;
    t?: string;
  };
};

const SubscriptionPage = async ({
  searchParams = {},
}: SubscriptionPageProps) => {
  let page = searchParams.page ? parseInt(searchParams.page, 10) : 1;
  page = Math.max(isNaN(page) ? 1 : page, 1);

  const sortField =
    searchParams.sort && sortsColumns.includes(searchParams.sort as SortColumn)
      ? (searchParams.sort as SortColumn)
      : 'endAt';

  const sortOrder = searchParams.order === 'asc' ? 'asc' : 'desc';
  const search = searchParams.s ?? null;
  const statusFilter =
    searchParams.st && statusFilters.includes(searchParams.st as Status)
      ? (searchParams.st as Status)
      : 'all';
  const typeFilter =
    searchParams.t && typesFilters.includes(searchParams.t as Type)
      ? (searchParams.t as Type)
      : 'all';

  const { subscriptions, count } = await getSubscriptionsPaged({
    offset: (page - 1) * PAGE_SIZE,
    limit: PAGE_SIZE,
    sortField,
    sortOrder,
    search,
    statusFilter,
    typeFilter,
  });
  return (
    <SubscriptionList
      subscriptions={subscriptions}
      count={count}
      page={page}
      pageSize={PAGE_SIZE}
      sortField={sortField}
      sortOrder={sortOrder}
      search={search}
      filters={{
        status: statusFilter,
        type: typeFilter,
      }}
    />
  );
};

export default SubscriptionPage;

const PAGE_SIZE = 100;
