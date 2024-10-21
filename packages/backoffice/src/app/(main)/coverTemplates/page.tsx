import { getCoverTemplatesWithTypeLabel } from '@azzapp/data';
import CoverTemplatesList from './CoverTemplatesList';

export type CoverTemplateItem = {
  id: string;
  name: string;
  type: string;
  mediaCount: number;
  status: boolean;
};

export type SortColumn = 'mediaCount' | 'name' | 'type';
export type StatusFilter = 'All' | 'Disabled' | 'Enabled';

type CoverTemplatesPageProps = {
  searchParams?: {
    page?: string;
    sort?: string;
    order?: string;
    s?: string;
    st?: string;
  };
};

const CoverTemplatesPage = async ({
  searchParams = {},
}: CoverTemplatesPageProps) => {
  let page = searchParams.page ? parseInt(searchParams.page, 10) : 1;
  page = Math.max(isNaN(page) ? 1 : page, 1);

  const sortField = searchParams.sort === 'type' ? 'type' : 'name';

  const sortOrder = searchParams.order === 'desc' ? 'desc' : 'asc';
  const search = searchParams.s ?? null;
  const statusFilter =
    searchParams.st && ['Disabled', 'Enabled', 'All'].includes(searchParams.st)
      ? (searchParams.st as StatusFilter)
      : 'All';

  const { items, count } = await getCoverTemplatesWithTypeLabel({
    offset: (page - 1) * PAGE_SIZE,
    limit: PAGE_SIZE,
    sortField,
    sortOrder,
    search,
    enabled: statusFilter === 'All' ? undefined : statusFilter === 'Enabled',
  });

  const coverTemplates = items
    .sort(({ coverTemplate: c1 }, { coverTemplate: c2 }) => {
      if (searchParams.sort !== 'mediaCount') {
        return 0;
      }

      return sortOrder === 'asc'
        ? c1.mediaCount - c2.mediaCount
        : c2.mediaCount - c1.mediaCount;
    })
    .map(({ coverTemplate, typeLabel }) => ({
      id: coverTemplate.id,
      name: coverTemplate.name,
      type: typeLabel,
      mediaCount: coverTemplate.mediaCount,
      status: coverTemplate.enabled,
    }));

  return (
    <CoverTemplatesList
      coverTemplates={coverTemplates}
      count={count}
      page={page}
      pageSize={PAGE_SIZE}
      sortField={searchParams.sort === 'mediaCount' ? 'mediaCount' : sortField}
      sortOrder={sortOrder}
      search={search}
      statusFilter={statusFilter}
    />
  );
};

export default CoverTemplatesPage;

const PAGE_SIZE = 100;
