import { Box, TextField, Typography } from '@mui/material';
import {
  getCoverTemplateTagsWithTemplatesCount,
  getLocalizationMessagesByKeys,
} from '@azzapp/data';
import { DEFAULT_LOCALE } from '@azzapp/i18n';
import { isDefined } from '@azzapp/shared/isDefined';
import { TEMPLATE_COVERTAG_DESCRIPTION_PREFIX } from '@azzapp/shared/translationsContants';
import CoverTemplateTagsList from './CoverTemplateTagsList';

export type CoverTemplateTagItem = {
  id: string;
  label: string | null;
  description?: string | null;
  templates: number;
  enabled: boolean;
};

const CoverTemplateTagsPage = async () => {
  const coverTemplateTags = await getCoverTemplateTagsWithTemplatesCount();
  const labels = await getLocalizationMessagesByKeys(
    coverTemplateTags.map(({ coverTemplateTag }) => coverTemplateTag.id),
    DEFAULT_LOCALE,
  );
  const descriptions = await getLocalizationMessagesByKeys(
    coverTemplateTags
      .map(
        ({ coverTemplateTag }) =>
          TEMPLATE_COVERTAG_DESCRIPTION_PREFIX + coverTemplateTag.id,
      )
      .filter(isDefined),
    DEFAULT_LOCALE,
  );

  const labelsMap = labels.reduce((acc, label) => {
    if (label) {
      acc.set(label.key, label.value);
    }
    return acc;
  }, new Map<string, string>());

  const descriptionsMap = descriptions.reduce((acc, label) => {
    if (label) {
      acc.set(label.key, label.value);
    }
    return acc;
  }, new Map<string, string>());

  const items = coverTemplateTags.map(
    ({ coverTemplateTag, templatesCount }) => ({
      id: coverTemplateTag.id,
      label: labelsMap.get(coverTemplateTag.id) || coverTemplateTag.id,
      description: descriptionsMap.get(
        TEMPLATE_COVERTAG_DESCRIPTION_PREFIX + coverTemplateTag.id,
      ),
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
        value="Cover filters are displayed at the top of the cover list view"
      />
      <CoverTemplateTagsList coverTemplateTags={items} />
    </Box>
  );
};

export default CoverTemplateTagsPage;
