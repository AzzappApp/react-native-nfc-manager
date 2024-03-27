import { asc, desc, isNull, sql } from 'drizzle-orm';
import { db } from '@azzapp/data/domains';
import { ReportTable } from '@azzapp/data/domains/report';
import ReportsList from './ReportsList';

const sortsColumns = {
  targetType: ReportTable.targetType,
  targetId: ReportTable.targetId,
};

const getReports = (
  page: number,
  sort: 'targetId' | 'targetType',
  order: 'asc' | 'desc',
) => {
  const query = db
    .select({
      targetId: ReportTable.targetId,
      targetType: ReportTable.targetType,
      count: sql`count(*)`.mapWith(Number),
    })
    .from(ReportTable)
    .offset(page * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .groupBy(ReportTable.targetId, ReportTable.targetType)
    .where(isNull(ReportTable.treatedBy))
    .orderBy(
      order === 'asc' ? asc(sortsColumns[sort]) : desc(sortsColumns[sort]),
    );

  return query.execute();
};

const countReports = async () => {
  const query = db
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(ReportTable)
    .groupBy(ReportTable.targetId, ReportTable.targetType);

  return query.then(rows => rows[0].count);
};

type ReportsPageProps = {
  searchParams?: {
    page?: string;
    sort?: string;
    order?: string;
  };
};

const ReportsPage = async ({ searchParams = {} }: ReportsPageProps) => {
  let page = searchParams.page ? parseInt(searchParams.page, 10) : 0;
  page = Math.max(isNaN(page) ? 1 : page, 1);

  const sort = Object.keys(sortsColumns).includes(searchParams.sort as any)
    ? (searchParams.sort as any)
    : 'targetId';

  const order =
    searchParams.order === 'desc'
      ? 'desc'
      : sort === 'targetId' && !searchParams.order
        ? 'desc'
        : 'asc';

  const reports = await getReports(page - 1, 'targetId', 'asc');

  const count = await countReports();

  return (
    <ReportsList
      reports={reports}
      count={count}
      page={page}
      pageSize={PAGE_SIZE}
      sortField={sort}
      sortOrder={order}
    />
  );
};

const PAGE_SIZE = 25;

export default ReportsPage;
