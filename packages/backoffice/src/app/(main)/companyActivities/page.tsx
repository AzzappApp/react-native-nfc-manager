import { asc, desc, eq, like, or, sql } from 'drizzle-orm';
import {
  CardTemplateTypeTable,
  CompanyActivityTable,
  CompanyActivityTypeTable,
  WebCardCategoryTable,
  db,
} from '@azzapp/data';
import CompanyActivitiesList from './CompanyActivitiesList';

export type CompanyActivityItem = {
  id: string;
  labelKey: string;
  cardTemplateTypeLabelKey: string;
  webCardCategoryLabelKey: string;
};

const sortsColumns = {
  labelKey: CompanyActivityTable.labelKey,
  cardTemplateTypeLabelKey: CardTemplateTypeTable.labelKey,
  webCardCategoryLabelKey: WebCardCategoryTable.labelKey,
  companyActivityTypeLabelKey: CompanyActivityTypeTable.labelKey,
};

export type SortColumn = keyof typeof sortsColumns;

const getActivitiesQuery = (search: string | null) => {
  let query = db
    .select({
      id: CompanyActivityTable.id,
      labelKey: CompanyActivityTable.labelKey,
      cardTemplateTypeLabelKey: sql`${CardTemplateTypeTable.labelKey}`
        .mapWith(String)
        .as('cardTemplateTypeLabelKey'),
      webCardCategoryLabelKey: sql`${WebCardCategoryTable.labelKey}`
        .mapWith(String)
        .as('webCardCategoryLabelKey'),
      companyActivityTypeLabelKey: sql`${CompanyActivityTypeTable.labelKey}`
        .mapWith(String)
        .as('companyActivityTypeLabelKey'),
    })
    .from(CompanyActivityTable)
    .innerJoin(
      CardTemplateTypeTable,
      eq(CardTemplateTypeTable.id, CompanyActivityTable.cardTemplateTypeId),
    )
    .innerJoin(
      WebCardCategoryTable,
      eq(WebCardCategoryTable.id, CardTemplateTypeTable.webCardCategoryId),
    )
    .leftJoin(
      CompanyActivityTypeTable,
      eq(
        CompanyActivityTypeTable.id,
        CompanyActivityTable.companyActivityTypeId,
      ),
    )
    .$dynamic();

  if (search) {
    query = query.where(
      or(
        like(CompanyActivityTable.labelKey, `%${search}%`),
        like(CompanyActivityTypeTable.labelKey, `%${search}%`),
        like(CardTemplateTypeTable.labelKey, `%${search}%`),
        like(WebCardCategoryTable.labelKey, `%${search}%`),
      ),
    );
  }

  return query;
};

const getActivities = (
  page: number,
  sort: SortColumn,
  order: 'asc' | 'desc',
  search: string | null,
) => {
  const query = getActivitiesQuery(search);

  query
    .offset(page * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .orderBy(
      order === 'asc' ? asc(sortsColumns[sort]) : desc(sortsColumns[sort]),
    );

  return query;
};

const countActivities = async (search: string | null) => {
  const subQuery = getActivitiesQuery(search);
  const query = db
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(subQuery.as('Activities'));

  return query.then(rows => rows[0].count);
};

type Props = {
  searchParams?: {
    page?: string;
    sort?: string;
    order?: string;
    s?: string;
  };
};

const CompanyActivitiesPage = async ({ searchParams = {} }: Props) => {
  let page = searchParams.page ? parseInt(searchParams.page, 10) : 0;
  page = Math.max(isNaN(page) ? 1 : page, 1);

  const sort = Object.keys(sortsColumns).includes(searchParams.sort as any)
    ? (searchParams.sort as any)
    : 'labelKey';

  const order = searchParams.order === 'desc' ? 'desc' : 'asc';
  const search = searchParams.s ?? null;
  const companyActivities = await getActivities(page - 1, sort, order, search);
  const count = await countActivities(search);

  return (
    <CompanyActivitiesList
      companyActivities={companyActivities}
      count={count}
      page={page}
      pageSize={PAGE_SIZE}
      sortField={sort}
      sortOrder={order}
      search={search}
    />
  );
};

export default CompanyActivitiesPage;

const PAGE_SIZE = 25;
