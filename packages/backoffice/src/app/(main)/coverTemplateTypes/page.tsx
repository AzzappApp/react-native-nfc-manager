import { Box, TextField, Typography } from '@mui/material';
import {
  getCoverTemplateTypesWithTemplatesCount,
  getLocalizationMessagesByKeys,
} from '@azzapp/data';
import { DEFAULT_LOCALE } from '@azzapp/i18n';
import CoverTemplateTypesList from './CoverTemplateTypesList';

export type CoverTemplateTypeItem = {
  id: string;
  label: string | null;
  templatesCount: number;
  enabled: boolean;
};

const CoverTemplateTypesPage = async () => {
  const coverTemplateTypes = await getCoverTemplateTypesWithTemplatesCount();
  const labels = await getLocalizationMessagesByKeys(
    coverTemplateTypes.map(({ coverTemplateType }) => coverTemplateType.id),
    DEFAULT_LOCALE,
  );
  const labelsMap = labels.reduce(
    (acc, message) => {
      if (message) {
        acc[message.key] = message.value;
      }
      return acc;
    },
    {} as Record<string, string>,
  );

  const items = coverTemplateTypes.map(
    ({ coverTemplateType, templatesCount }) => ({
      id: coverTemplateType.id,
      label: labelsMap[coverTemplateType.id] ?? coverTemplateType.id,
      templatesCount,
      enabled: coverTemplateType.enabled,
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
        Covers templates types
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
        value="Cover template types correspond to the different lines in the cover list view"
      />
      <CoverTemplateTypesList coverTemplateTypes={items} />
    </Box>
  );
};

export default CoverTemplateTypesPage;
