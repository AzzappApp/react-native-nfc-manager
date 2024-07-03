import { Box, TextField, Typography } from '@mui/material';
import { eq, like, or, sql, and, asc, desc } from 'drizzle-orm';
import {
  CardTemplateTable,
  CardTemplateTypeTable,
  LabelTable,
  db,
} from '@azzapp/data';
import CardTemplatesList from './CardTemplatesList';
import type { CardModuleTemplate } from '@azzapp/data';

export type CardTemplateItem = {
  id: string;
  label: string | null;
  type: string;
  modules: CardModuleTemplate[];
  personalEnabled: boolean;
  businessEnabled: boolean;
};

export type Status = 'Disabled' | 'Enabled';

export type Filters = {
  personalStatus?: Status | 'All';
  businessStatus?: Status | 'All';
};

const getFilters = (filters: Filters) => {
  const f = [];
  if (filters.personalStatus && filters.personalStatus !== 'All') {
    f.push(eq(sql`personalEnabled`, filters.personalStatus === 'Enabled'));
  }
  if (filters.businessStatus && filters.businessStatus !== 'All') {
    f.push(eq(sql`businessEnabled`, filters.businessStatus === 'Enabled'));
  }

  return f;
};

const getSearch = (search: string | null) => {
  if (search) {
    return or(
      like(LabelTable.baseLabelValue, `%${search}%`),
      like(CardTemplateTypeTable.labelKey, `%${search}%`),
    );
  }
};

export type SortColumn = 'label' | 'type';

const sortsColumns = {
  label: LabelTable.baseLabelValue,
  type: sql`type`,
  personalEnabled: sql`personalEnabled`,
  businessEnabled: sql`businessEnabled`,
};

const getQuery = (search: string | null, filters: Filters) => {
  const query = db
    .select({
      id: CardTemplateTable.id,
      label: LabelTable.baseLabelValue,
      type: sql`${CardTemplateTypeTable.labelKey}`.mapWith(String).as('type'),
      modules: CardTemplateTable.modules,
      personalEnabled: CardTemplateTable.personalEnabled,
      businessEnabled: CardTemplateTable.businessEnabled,
    })
    .from(CardTemplateTable)
    .innerJoin(
      CardTemplateTypeTable,
      eq(CardTemplateTable.cardTemplateTypeId, CardTemplateTypeTable.id),
    )
    .leftJoin(LabelTable, eq(CardTemplateTable.labelKey, LabelTable.labelKey))
    .where(and(getSearch(search), ...getFilters(filters)))
    .$dynamic();

  return query;
};

const getCardTemplates = (
  page: number,
  sort: SortColumn,
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
    ps?: string;
    bs?: string;
  };
};

const CardTemplatesPage = async ({ searchParams = {} }: Props) => {
  let page = searchParams.page ? parseInt(searchParams.page, 10) : 1;
  page = Math.max(isNaN(page) ? 1 : page, 1);

  const sort = Object.keys(sortsColumns).includes(searchParams.sort as any)
    ? (searchParams.sort as any)
    : 'label';

  const order = searchParams.order === 'desc' ? 'desc' : 'asc';
  const search = searchParams.s ?? null;
  const filters: Filters = {
    personalStatus: (searchParams.ps as Status) || 'All',
    businessStatus: (searchParams.bs as Status) || 'All',
  };

  const cardTemplates = await getCardTemplates(
    page - 1,
    sort,
    order,
    search,
    filters,
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
        WebCards templates
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
        value={
          'WebCard templates are associated to a template type, and displayed horizontally in the “load template” view'
        }
      />
      <CardTemplatesList
        cardTemplates={cardTemplates}
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

export default CardTemplatesPage;

const PAGE_SIZE = 25;
