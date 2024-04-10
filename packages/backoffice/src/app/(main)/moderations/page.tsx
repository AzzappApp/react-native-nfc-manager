import { asc, desc, eq, sql, and } from 'drizzle-orm';
import { db, ReportTable } from '@azzapp/data';
import ReportsList from './ModerationList';
import type { SQLWrapper } from 'drizzle-orm';

export type ReportStatus = 'Closed' | 'Opened';
export type ReportKind = 'comment' | 'post' | 'webCard';

export type ModerationItem = {
  targetId: string;
  targetType: string;
  reportCount: number;
  latestReport: string | null;
  treatedAt: string | null;
  status: ReportStatus;
};

export type Filters = {
  status?: ReportStatus | 'all';
  kind?: ReportKind | 'all';
};

const getFilters = (filters: Filters): SQLWrapper[] => {
  const f: SQLWrapper[] = [];
  if (filters.status && filters.status !== 'all') {
    f.push(eq(sql`status`, filters.status === 'Opened' ? 1 : 0));
  }
  if (filters.kind && filters.kind !== 'all') {
    f.push(eq(sql`targetType`, filters.kind));
  }

  return f;
};

const sortsColumns = {
  targetId: ReportTable.targetId,
  targetType: ReportTable.targetType,
  reportCount: sql`reportCount`,
  latestReport: sql`latestReport`,
  treatedAt: sql`treatedAt`,
};

const getReportsQuery = () => {
  const query = db
    .select({
      targetId: ReportTable.targetId,
      targetType: ReportTable.targetType,
      reportCount: sql`count(*)`.mapWith(Number).as('reportCount'),
      latestReport: sql`max(${ReportTable.createdAt})`
        .mapWith(Date)
        .as('latestReport'),
      treatedAt: sql`max(${ReportTable.treatedAt})`
        .mapWith(Date)
        .as('treatedAt'),
      status:
        sql`(ISNULL(MAX(${ReportTable.treatedAt})) OR DATEDIFF(MAX(${ReportTable.treatedAt}), MAX(${ReportTable.createdAt})) < 0)`
          .mapWith(Number)
          .as('status'),
    })
    .from(ReportTable)
    .groupBy(ReportTable.targetId, ReportTable.targetType)
    .$dynamic();

  return query;
};

const getFilteredReports = (
  page: number,
  sort: 'latestReport' | 'targetId' | 'targetType',
  order: 'asc' | 'desc',
  filters: Filters,
) => {
  const subQuery = getReportsQuery();
  const query = db
    .select()
    .from(subQuery.as('Report'))
    .where(and(...getFilters(filters)));

  query
    .offset(page * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .orderBy(
      order === 'asc' ? asc(sortsColumns[sort]) : desc(sortsColumns[sort]),
    );

  return query;
};

const countReports = async (
  page: number,
  sort: 'latestReport' | 'targetId' | 'targetType',
  order: 'asc' | 'desc',
  filters: Filters,
) => {
  const subQuery = getReportsQuery();
  const query = db
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(subQuery.as('Report'))
    .where(and(...getFilters(filters)));

  return query.then(rows => rows[0].count);
};

type ModerationsPageProps = {
  searchParams?: {
    page?: string;
    sort?: string;
    order?: string;
    status?: string;
    kind?: string;
  };
};

const ModerationsPage = async ({ searchParams = {} }: ModerationsPageProps) => {
  let page = searchParams.page ? parseInt(searchParams.page, 10) : 1;
  page = Math.max(isNaN(page) ? 1 : page, 1);

  const sort = Object.keys(sortsColumns).includes(searchParams.sort as any)
    ? (searchParams.sort as any)
    : 'latestReport';

  const order = searchParams.order === 'asc' ? 'asc' : 'desc';
  const filters: Filters = {
    status: (searchParams.status as ReportStatus) || 'Opened',
    kind: (searchParams.kind as ReportKind) || 'all',
  };

  const reports = await getFilteredReports(page - 1, sort, order, filters);
  const moderationReports: ModerationItem[] = reports.map(report => ({
    ...report,
    status: report.status ? 'Opened' : 'Closed',
  }));
  const count = await countReports(page - 1, sort, order, filters);

  return (
    <ReportsList
      reports={moderationReports}
      count={count}
      page={page}
      pageSize={PAGE_SIZE}
      sortField={sort}
      sortOrder={order}
      filters={filters}
    />
  );
};

const PAGE_SIZE = 25;

export default ModerationsPage;
