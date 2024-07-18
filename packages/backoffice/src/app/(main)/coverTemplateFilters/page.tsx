import { Box, TextField, Typography } from '@mui/material';
import { and, asc, desc, eq, like, or, sql } from 'drizzle-orm';
import {
  CoverTemplateTable,
  CoverTemplateTagTable,
  LocalizationMessageTable,
  db,
} from '@azzapp/data';
import { DEFAULT_LOCALE, ENTITY_TARGET } from '@azzapp/i18n';
import CoverTemplateTypesList from './CoverTemplateTagsList';
import type { SQLWrapper } from 'drizzle-orm';

export type CoverTemplateTagItem = {
  id: string;
  label: string | null;
  templates: number;
  enabled: boolean;
};

export type Filters = {
  enabled?: string | null;
};

const sortsColumns = {
  label: LocalizationMessageTable.value,
  order: CoverTemplateTagTable.order,
  enabled: CoverTemplateTagTable.enabled,
};

const getFilters = (filters: Filters): SQLWrapper[] => {
  const f: SQLWrapper[] = [];
  if (filters.enabled && filters.enabled !== 'all') {
    f.push(eq(CoverTemplateTagTable.enabled, filters.enabled === 'true'));
  }

  return f;
};

const getSearch = (search: string | null) => {
  if (search) {
    return or(
      like(LocalizationMessageTable.value, `%${search}%`),
      like(CoverTemplateTagTable.order, `%${search}%`),
    );
  }
};

const getQuery = (search: string | null, filters: Filters) => {
  const query = db
    .select({
      id: CoverTemplateTagTable.id,
      label: LocalizationMessageTable.value,
      enabled: CoverTemplateTagTable.enabled,
    })
    .from(CoverTemplateTagTable)
    .leftJoin(
      LocalizationMessageTable,
      and(
        eq(CoverTemplateTagTable.id, LocalizationMessageTable.key),
        eq(LocalizationMessageTable.target, ENTITY_TARGET),
        eq(LocalizationMessageTable.locale, DEFAULT_LOCALE),
      ),
    )
    .orderBy(asc(CoverTemplateTagTable.order))
    .where(and(getSearch(search), ...getFilters(filters)))
    .$dynamic();

  return query;
};

const getCoverTemplateTags = (
  page: number,
  sort: 'enabled' | 'label' | 'order',
  order: 'asc' | 'desc',
  search: string | null,
  filters: Filters,
) => {
  const query = getQuery(search, filters);

  query
    .offset(page * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .orderBy(
      order === 'asc' ? asc(sortsColumns[sort]) : desc(sortsColumns[sort]),
    );

  return query;
};

const getCount = async (search: string | null, filters: Filters) => {
  const subQuery = getQuery(search, filters);
  const query = db
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(subQuery.as('subQuery'));

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

const CoverTemplateTagsPage = async ({ searchParams = {} }: Props) => {
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

  const coverTemplateTags = await getCoverTemplateTags(
    page - 1,
    sort,
    order,
    search,
    filters,
  );

  const templatesCounts = await Promise.all(
    coverTemplateTags.map(coverTemplateTag => {
      return db
        .select({ count: sql`count(*)`.mapWith(Number) })
        .from(CoverTemplateTable)
        .where(eq(CoverTemplateTable.typeId, coverTemplateTag.id))
        .then(res => res[0].count);
    }),
  );

  const count = await getCount(search, filters);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        Covers templates filters
      </Typography>
      <TextField
        id="note"
        inputProps={{
          readOnly: true,
        }}
        label="Note"
        multiline
        rows={1}
        maxRows={3}
        value={'Cover filters are displayed at the top of the cover list view'}
      />
      <CoverTemplateTypesList
        search={null}
        count={count}
        coverTemplateTags={coverTemplateTags.map((coverTemplateType, i) => ({
          ...coverTemplateType,
          templates: templatesCounts[i],
        }))}
        page={page}
        pageSize={PAGE_SIZE}
        sortField={sort}
        sortOrder={order}
      />
    </Box>
  );
};

const PAGE_SIZE = 25;

export default CoverTemplateTagsPage;
