import { getReportsByTarget } from '@azzapp/data';
import ReportsList from './ModerationList';

export type ModerationItem = {
  targetId: string;
  targetType: string;
  reportCount: number;
  latestReport: string | null;
  treatedAt: string | null;
  status: Exclude<ReportStatus, 'all'>;
};

export type Filters = {
  status?: ReportStatus;
  kind?: ReportKind;
};

type ModerationPageProps = {
  searchParams?: {
    page?: string;
    sort?: string;
    order?: string;
    status?: string;
    kind?: string;
  };
};

const sortColumns = [
  'latestReport',
  'reportCount',
  'status',
  'targetId',
  'targetType',
  'treatedAt',
] as const;

export type SortFields = (typeof sortColumns)[number];

const reportStatus = ['all', 'closed', 'open'] as const;

export type ReportStatus = (typeof reportStatus)[number];

const reportKind = ['all', 'comment', 'post', 'webCard'] as const;

export type ReportKind = (typeof reportKind)[number];

const ModerationPage = async ({ searchParams = {} }: ModerationPageProps) => {
  let page = searchParams.page ? parseInt(searchParams.page, 10) : 1;
  page = Math.max(isNaN(page) ? 1 : page, 1);

  const sortField: SortFields =
    searchParams.sort && sortColumns.includes(searchParams.sort as any)
      ? (searchParams.sort as SortFields)
      : 'latestReport';

  const sortOrder = searchParams.order === 'asc' ? 'asc' : 'desc';

  const statusFilter =
    searchParams.status && reportStatus.includes(searchParams.status as any)
      ? (searchParams.status as ReportStatus)
      : 'all';

  const kindFilter =
    searchParams.kind && reportKind.includes(searchParams.kind as any)
      ? (searchParams.kind as ReportKind)
      : 'all';

  const { reports: moderationReports, count } = await getReportsByTarget({
    offset: (page - 1) * PAGE_SIZE,
    limit: PAGE_SIZE,
    status: statusFilter,
    targetType: kindFilter,
    sort: {
      sortField,
      sortOrder,
    },
  });

  const reports = moderationReports.map(
    ({
      targetId,
      targetType,
      reportCount,
      latestReport,
      treatedAt,
      status,
    }) => ({
      targetId,
      targetType,
      reportCount,
      latestReport: latestReport?.toString() ?? null,
      treatedAt: treatedAt?.toString() ?? null,
      status: status === 1 ? ('open' as const) : ('closed' as const),
    }),
  );

  return (
    <ReportsList
      reports={reports}
      count={count}
      page={page}
      pageSize={PAGE_SIZE}
      sortField={sortField}
      sortOrder={sortOrder}
      filters={{
        status: statusFilter,
        kind: kindFilter,
      }}
    />
  );
};

const PAGE_SIZE = 25;

export default ModerationPage;
