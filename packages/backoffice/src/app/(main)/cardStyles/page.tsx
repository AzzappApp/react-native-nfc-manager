import { Box, TextField, Typography } from '@mui/material';
import { like, or, asc, desc, sql, eq } from 'drizzle-orm';
import { CardStyleTable, LabelTable, db } from '@azzapp/data';
import CardStylesList from './CardStylesList';

export type CardStyleItem = {
  id: string;
  label: string | null;
  enabled: boolean;
};

export type SortColumn = 'label';

const sortsColumns = {
  label: LabelTable.baseLabelValue,
};

const getCardStylesQuery = (search: string | null) => {
  let query = db
    .select({
      id: CardStyleTable.id,
      label: LabelTable.baseLabelValue,
      enabled: CardStyleTable.enabled,
    })
    .from(CardStyleTable)
    .leftJoin(LabelTable, eq(CardStyleTable.labelKey, LabelTable.labelKey))
    .$dynamic();

  if (search) {
    query = query.where(or(like(LabelTable.baseLabelValue, `%${search}%`)));
  }

  return query;
};

const getCardStyles = (
  page: number,
  sort: SortColumn,
  order: 'asc' | 'desc',
  search: string | null,
) => {
  const query = getCardStylesQuery(search);

  query
    .offset(page * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .orderBy(
      order === 'asc' ? asc(sortsColumns[sort]) : desc(sortsColumns[sort]),
    );

  return query;
};

const getCount = async (search: string | null) => {
  const subQuery = getCardStylesQuery(search);
  const query = db
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(subQuery.as('Subquery'));

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

const CardStylesPage = async ({ searchParams = {} }: Props) => {
  let page = searchParams.page ? parseInt(searchParams.page, 10) : 0;
  page = Math.max(isNaN(page) ? 1 : page, 1);

  const sort = Object.keys(sortsColumns).includes(searchParams.sort as any)
    ? (searchParams.sort as any)
    : 'label';

  const order = searchParams.order === 'desc' ? 'desc' : 'asc';
  const search = searchParams.s ?? null;
  const cardStyles = await getCardStyles(page - 1, sort, order, search);
  const count = await getCount(search);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        WebCards Styles
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
          'WebCard styles allows to set different parameters like border radius, title font etc... of all the WebCard'
        }
      />
      <CardStylesList
        cardStyles={cardStyles}
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

export default CardStylesPage;

const PAGE_SIZE = 25;
