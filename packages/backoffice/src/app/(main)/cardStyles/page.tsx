import { Box, TextField, Typography } from '@mui/material';
import { getCardStylesWithLabel } from '@azzapp/data';
import CardStylesList from './CardStylesList';

export type CardStyleItem = {
  id: string;
  label: string | null;
  enabled: boolean;
};

export type SortColumn = 'label';

type CardStylesPageProps = {
  searchParams?: Promise<{
    page?: string;
    sort?: string;
    order?: string;
    s?: string;
  }>;
};

const CardStylesPage = async (props: CardStylesPageProps) => {
  const searchParams = await props.searchParams;
  let page = searchParams?.page ? parseInt(searchParams.page, 10) : 0;
  page = Math.max(isNaN(page) ? 1 : page, 1);

  const order = searchParams?.order === 'desc' ? 'desc' : 'asc';
  const search = searchParams?.s ?? null;
  const { cardStyles, count } = await getCardStylesWithLabel({
    offset: (page - 1) * PAGE_SIZE,
    limit: PAGE_SIZE,
    sortOrder: order,
    search,
  });
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
        value="WebCard styles allows to set different parameters like border radius, title font etc... of all the WebCard"
      />
      <CardStylesList
        cardStyles={cardStyles.map(({ cardStyle, label }) => ({
          id: cardStyle.id,
          label: label ?? cardStyle.id,
          enabled: cardStyle.enabled,
        }))}
        count={count}
        page={page}
        pageSize={PAGE_SIZE}
        sortField="label"
        sortOrder={order}
        search={search}
      />
    </Box>
  );
};

export default CardStylesPage;

const PAGE_SIZE = 25;
