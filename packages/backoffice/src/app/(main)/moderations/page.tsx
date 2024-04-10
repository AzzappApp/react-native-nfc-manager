import { asc, desc, like, or, sql } from 'drizzle-orm';
import { db, ReportTable } from '@azzapp/data';
import ReportsList from './ModerationList';

export type ReportStatus = 'Closed' | 'Opened';

export type ModerationItem = {
  targetId: string;
  targetType: string;
  reportCount: number;
  latestReport: string | null;
  treatedAt: string | null;
  status: ReportStatus;
};

const sortsColumns = {
  targetId: ReportTable.targetId,
  targetType: ReportTable.targetType,
  reportCount: sql`reportCount`,
  latestReport: sql`latestReport`,
  treatedAt: sql`treatedAt`,
};

const getReports = (
  page: number,
  sort: 'latestReport' | 'targetId' | 'targetType',
  order: 'asc' | 'desc',
  search: string | null,
) => {
  let query = db
    .select({
      targetId: ReportTable.targetId,
      targetType: ReportTable.targetType,
      reportCount: sql`count(*) as reportCount`.mapWith(Number),
      latestReport: sql`max(${ReportTable.createdAt}) as latestReport`.mapWith(
        Date,
      ),
      treatedAt: sql`max(${ReportTable.treatedAt}) as treatedAt`.mapWith(Date),
    })
    .from(ReportTable)
    .groupBy(ReportTable.targetId, ReportTable.targetType)
    .$dynamic();

  if (search) {
    query = query.where(or(like(ReportTable.targetType, `%${search}%`)));
  }

  return query
    .offset(page * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .orderBy(
      order === 'asc' ? asc(sortsColumns[sort]) : desc(sortsColumns[sort]),
    );
};

const countReports = async () => {
  const query = db
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(ReportTable)
    .groupBy(ReportTable.targetId, ReportTable.targetType);

  return query.then(rows => rows.length);
};

type ModerationsPageProps = {
  searchParams?: {
    page?: string;
    sort?: string;
    order?: string;
    s?: string;
  };
};

const ModerationsPage = async ({ searchParams = {} }: ModerationsPageProps) => {
  let page = searchParams.page ? parseInt(searchParams.page, 10) : 1;
  page = Math.max(isNaN(page) ? 1 : page, 1);

  const sort = Object.keys(sortsColumns).includes(searchParams.sort as any)
    ? (searchParams.sort as any)
    : 'latestReport';

  const order = searchParams.order === 'asc' ? 'asc' : 'desc';
  const search = searchParams.s ?? null;

  const reports = await getReports(page - 1, sort, order, search);
  const moderationReports: ModerationItem[] = reports.map(report => ({
    ...report,
    status:
      !report.treatedAt ||
      new Date(report.treatedAt) < new Date(report.latestReport)
        ? 'Opened'
        : 'Closed',
  }));
  const count = await countReports();

  return (
    <ReportsList
      reports={moderationReports}
      count={count}
      page={page}
      pageSize={PAGE_SIZE}
      sortField={sort}
      sortOrder={order}
      search={search}
    />
  );
};

const PAGE_SIZE = 25;

export default ModerationsPage;
