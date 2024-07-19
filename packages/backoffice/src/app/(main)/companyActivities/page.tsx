import { Box, TextField, Typography } from '@mui/material';
import { and, asc, desc, eq, like, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import {
  CardTemplateTypeTable,
  CompanyActivityTable,
  LocalizationMessageTable,
  db,
} from '@azzapp/data';
import { DEFAULT_LOCALE, ENTITY_TARGET } from '@azzapp/i18n';
import CompanyActivitiesList from './CompanyActivitiesList';

export type CompanyActivityItem = {
  id: string;
  label: string | null;
  cardTemplateTypeLabel: string | null;
  webCardCategoryLabel: string | null;
  companyActivityTypeLabel: string | null;
};

const CardTemplateTypeMessage = alias(
  LocalizationMessageTable,
  'CardTemplateTypeMessage',
);

const WebCardCategoryMessage = alias(
  LocalizationMessageTable,
  'WebCardCategoryMessage',
);

const CompanyActivityTypeMessage = alias(
  LocalizationMessageTable,
  'CompanyActivityTypeMessage',
);

const sortsColumns = {
  label: LocalizationMessageTable.value,
  cardTemplateTypeLabel: CardTemplateTypeMessage.value,
  webCardCategoryLabel: WebCardCategoryMessage.value,
  companyActivityTypeLabel: CompanyActivityTypeMessage.value,
};

export type SortColumn = keyof typeof sortsColumns;

const getActivitiesQuery = (search: string | null) => {
  let query = db
    .select({
      id: CompanyActivityTable.id,
      label: LocalizationMessageTable.value,
      cardTemplateTypeLabel: sql`${CardTemplateTypeMessage.value}`
        .mapWith(String)
        .as('cardTemplateTypeLabel'),
      webCardCategoryLabel: sql`${WebCardCategoryMessage.value}`
        .mapWith(String)
        .as('webCardCategoryLabel'),
      companyActivityTypeLabel: sql`${CompanyActivityTypeMessage.value}`
        .mapWith(String)
        .as('companyActivityTypeLabel'),
    })
    .from(CompanyActivityTable)
    .leftJoin(
      CardTemplateTypeTable,
      eq(CardTemplateTypeTable.id, CompanyActivityTable.cardTemplateTypeId),
    )
    .leftJoin(
      LocalizationMessageTable,
      eq(CompanyActivityTable.id, LocalizationMessageTable.key),
    )
    .leftJoin(
      CardTemplateTypeMessage,
      and(
        eq(
          CompanyActivityTable.cardTemplateTypeId,
          CardTemplateTypeMessage.key,
        ),
        eq(CardTemplateTypeMessage.target, ENTITY_TARGET),
        eq(CardTemplateTypeMessage.locale, DEFAULT_LOCALE),
      ),
    )
    .leftJoin(
      WebCardCategoryMessage,
      and(
        eq(CardTemplateTypeTable.webCardCategoryId, WebCardCategoryMessage.key),
        eq(WebCardCategoryMessage.target, ENTITY_TARGET),
        eq(WebCardCategoryMessage.locale, DEFAULT_LOCALE),
      ),
    )
    .leftJoin(
      CompanyActivityTypeMessage,
      and(
        eq(
          CompanyActivityTable.companyActivityTypeId,
          CompanyActivityTypeMessage.key,
        ),
        eq(CompanyActivityTypeMessage.target, ENTITY_TARGET),
        eq(CompanyActivityTypeMessage.locale, DEFAULT_LOCALE),
      ),
    )
    .$dynamic();

  if (search) {
    query = query.where(
      or(
        like(LocalizationMessageTable.value, `%${search}%`),
        like(CompanyActivityTypeMessage.value, `%${search}%`),
        like(CardTemplateTypeMessage.value, `%${search}%`),
        like(WebCardCategoryMessage.value, `%${search}%`),
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
    : 'label';

  const order = searchParams.order === 'desc' ? 'desc' : 'asc';
  const search = searchParams.s ?? null;
  const companyActivities = await getActivities(page - 1, sort, order, search);
  const count = await countActivities(search);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        Activities
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
        value={'Activities will impact the suggested cover template'}
      />
      <CompanyActivitiesList
        companyActivities={companyActivities}
        count={count}
        page={page}
        pageSize={PAGE_SIZE}
        sortField={sort}
        sortOrder={order}
        search={search}
      />
    </Box>
  );
};

export default CompanyActivitiesPage;

const PAGE_SIZE = 25;
