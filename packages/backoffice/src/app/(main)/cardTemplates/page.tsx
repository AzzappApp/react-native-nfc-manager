import { Box, TextField, Typography } from '@mui/material';
import {
  getAllCardTemplates,
  getLocalizationMessagesByLocaleAndTarget,
} from '@azzapp/data';
import { DEFAULT_LOCALE, ENTITY_TARGET } from '@azzapp/i18n';
import CardTemplatesList from './CardTemplatesList';
import type { CardModuleTemplate } from '@azzapp/data';

export type CardTemplateItem = {
  id: string;
  label: string | null;
  type: string | null;
  modules: CardModuleTemplate[];
  personalEnabled: boolean;
  businessEnabled: boolean;
};

export type Status = 'Disabled' | 'Enabled';

export type Filters = {
  personalStatus?: Status | 'All';
  businessStatus?: Status | 'All';
};

const sortsColumns = ['label', 'type', 'personalEnabled', 'businessEnabled'];

export type SortColumn = (typeof sortsColumns)[number];

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

  const sort =
    searchParams.sort && Object.keys(sortsColumns).includes(searchParams.sort)
      ? searchParams.sort
      : 'label';

  const order = searchParams.order === 'desc' ? 'desc' : 'asc';
  const search = searchParams.s ?? null;
  const filters: Filters = {
    personalStatus: (searchParams.ps as Status) || 'All',
    businessStatus: (searchParams.bs as Status) || 'All',
  };

  const [cardTemplates, labels] = await Promise.all([
    getAllCardTemplates(),
    await getLocalizationMessagesByLocaleAndTarget(
      DEFAULT_LOCALE,
      ENTITY_TARGET,
    ),
  ]);
  const labelsMap = new Map(labels.map(label => [label.key, label.value]));

  const items = cardTemplates
    .map(cardTemplate => ({
      id: cardTemplate.id,
      label: labelsMap.get(cardTemplate.id) ?? null,
      type: cardTemplate.cardTemplateTypeId
        ? labelsMap.get(cardTemplate.cardTemplateTypeId) ??
          cardTemplate.cardTemplateTypeId
        : null,
      modules: cardTemplate.modules,
      personalEnabled: cardTemplate.personalEnabled,
      businessEnabled: cardTemplate.businessEnabled,
    }))
    .filter(item => {
      if (
        (filters.personalStatus === 'Disabled' && item.personalEnabled) ||
        (filters.personalStatus === 'Enabled' && !item.personalEnabled)
      ) {
        return false;
      }
      if (
        (filters.businessStatus === 'Disabled' && item.businessEnabled) ||
        (filters.businessStatus === 'Enabled' && !item.businessEnabled)
      ) {
        return false;
      }
      if (search) {
        return (
          item.label?.toLowerCase().includes(search.toLowerCase()) ||
          item.type?.toLowerCase().includes(search.toLowerCase())
        );
      }
      return true;
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
        cardTemplates={items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)}
        count={items.length}
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
