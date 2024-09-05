import { Box, TextField, Typography } from '@mui/material';
import {
  getCoverTemplateTagsWithTemplatesCount,
  getLocalizationMessagesByKeys,
} from '@azzapp/data';
import { DEFAULT_LOCALE, ENTITY_TARGET } from '@azzapp/i18n';
import CoverTemplateTagsList from './CoverTemplateTagsList';

export type CoverTemplateTagItem = {
  id: string;
  label: string | null;
  templates: number;
  enabled: boolean;
};

const CoverTemplateTagsPage = async () => {
  const coverTemplateTags = await getCoverTemplateTagsWithTemplatesCount();
  const labels = await getLocalizationMessagesByKeys(
    coverTemplateTags.map(({ coverTemplateTag }) => coverTemplateTag.id),
    DEFAULT_LOCALE,
    ENTITY_TARGET,
  );

  const labelsMap = labels.reduce((acc, label) => {
    if (label) {
      acc.set(label.key, label.value);
    }
    return acc;
  }, new Map<string, string>());

  const items = coverTemplateTags.map(
    ({ coverTemplateTag, templatesCount }) => ({
      id: coverTemplateTag.id,
      label: labelsMap.get(coverTemplateTag.id) || coverTemplateTag.id,
      templates: templatesCount,
      enabled: coverTemplateTag.enabled,
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
      <CoverTemplateTagsList coverTemplateTags={items} />
    </Box>
  );
};

export default CoverTemplateTagsPage;
