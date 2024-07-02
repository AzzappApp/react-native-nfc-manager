import { Box, TextField, Typography } from '@mui/material';
import { asc, desc, eq, like, or, sql, and } from 'drizzle-orm';
import { LabelTable, WebCardCategoryTable, db } from '@azzapp/data';
import WebCardCategoriesList from './WebCardCategoriesList';
import type { SQLWrapper } from 'drizzle-orm';

export type WebCardCategoryItem = {
  id: string;
  label: string | null;
  webCardKind: 'business' | 'personal';
  order: number;
  enabled: boolean;
};

const sortsColumns = {
  label: LabelTable.baseLabelValue,
  webCardKind: WebCardCategoryTable.webCardKind,
  order: WebCardCategoryTable.order,
  enabled: WebCardCategoryTable.enabled,
};

export type Filters = {
  enabled?: string | null;
};

const getFilters = (filters: Filters): SQLWrapper[] => {
  const f: SQLWrapper[] = [];
  if (filters.enabled && filters.enabled !== 'all') {
    f.push(eq(WebCardCategoryTable.enabled, filters.enabled === 'true'));
  }

  return f;
};

const getSearch = (search: string | null) => {
  if (search) {
    return or(
      like(LabelTable.baseLabelValue, `%${search}%`),
      like(WebCardCategoryTable.webCardKind, `%${search}%`),
      like(WebCardCategoryTable.order, `%${search}%`),
    );
  }
};

const getCategories = (
  page: number,
  sort: 'enabled' | 'label' | 'order' | 'webCardKind',
  order: 'asc' | 'desc',
  search: string | null,
  filters: Filters,
) => {
  const query = db
    .select({
      id: WebCardCategoryTable.id,
      label: LabelTable.baseLabelValue,
      webCardKind: WebCardCategoryTable.webCardKind,
      order: WebCardCategoryTable.order,
      enabled: WebCardCategoryTable.enabled,
    })
    .from(WebCardCategoryTable)
    .leftJoin(
      LabelTable,
      eq(WebCardCategoryTable.labelKey, LabelTable.labelKey),
    )
    .orderBy(asc(WebCardCategoryTable.order))
    .where(and(getSearch(search), ...getFilters(filters)))
    .$dynamic();

  query
    .offset(page * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .orderBy(
      order === 'asc' ? asc(sortsColumns[sort]) : desc(sortsColumns[sort]),
    );

  return query;
};

const getCategoriesCount = async (search: string | null, filters: Filters) => {
  const query = db
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(WebCardCategoryTable)
    .orderBy(asc(WebCardCategoryTable.order))
    .where(and(getSearch(search), ...getFilters(filters)));

  return query.then(rows => rows[0].count);
};

type Props = {
  searchParams?: {
    page?: string;
    sort?: string;
    order?: string;
    s?: string;
    status?: string;
  };
};

const ProfileCategoriesPage = async ({ searchParams = {} }: Props) => {
  let page = searchParams.page ? parseInt(searchParams.page, 10) : 1;
  page = Math.max(isNaN(page) ? 1 : page, 1);

  const sort = Object.keys(sortsColumns).includes(searchParams.sort as any)
    ? (searchParams.sort as any)
    : 'order';

  const order = searchParams.order === 'desc' ? 'desc' : 'asc';
  const search = searchParams.s ?? null;
  const filters: Filters = {
    enabled: searchParams.status ?? 'all',
  };

  const webCardCategories = await getCategories(
    page - 1,
    sort,
    order,
    search,
    filters,
  );
  const count = await getCategoriesCount(search, filters);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        Categories
      </Typography>
      <TextField
        id="note"
        inputProps={{
          readOnly: true,
        }}
        label="Note"
        multiline
        rows={3}
        maxRows={4}
        value={
          'Categories of the WebCard are at the top level, it defines the kind of WebCard users will create.\nCategories (even disabled) are also used in the WebCard template list view in order to group different Templates types together.'
        }
      />
      <WebCardCategoriesList
        webCardCategories={webCardCategories}
        count={count}
        page={page}
        pageSize={PAGE_SIZE}
        sortField={sort}
        sortOrder={order}
        search={search}
        filters={filters}
      />
    </Box>
  );
};

export default ProfileCategoriesPage;

const PAGE_SIZE = 25;
