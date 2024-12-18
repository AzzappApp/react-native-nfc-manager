import { Box, TextField, Typography } from '@mui/material';
import {
  getCardTemplateTypesWithTemplatesCount,
  getLocalizationMessagesByLocale,
} from '@azzapp/data';
import { DEFAULT_LOCALE } from '@azzapp/i18n';
import CardTemplateTypesList from './CardTemplateTypesList';

export type CardTemplateTypeItem = {
  id: string;
  label: string | null;
  category: string;
  status: boolean;
  templatesCount: number;
};

const CardTemplateTypesPage = async () => {
  const [cardTemplateTypes, labels] = await Promise.all([
    getCardTemplateTypesWithTemplatesCount(),
    getLocalizationMessagesByLocale(DEFAULT_LOCALE),
  ]);

  const labelsMap = new Map(labels.map(({ key, value }) => [key, value]));
  const items = cardTemplateTypes.map(
    ({ cardTemplateType, templatesCount }) => ({
      id: cardTemplateType.id,
      label: labelsMap.get(cardTemplateType.id) || null,
      category:
        labelsMap.get(cardTemplateType.webCardCategoryId) ??
        cardTemplateType.webCardCategoryId,
      status: cardTemplateType.enabled,
      templatesCount,
    }),
  );

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        WebCards templates types
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
          'WebCard templates types are the lowest level in the template list view'
        }
      />
      <CardTemplateTypesList cardTemplateTypes={items} />
    </Box>
  );
};

export default CardTemplateTypesPage;
