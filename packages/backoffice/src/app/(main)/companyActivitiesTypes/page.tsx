import { Box, TextField, Typography } from '@mui/material';
import {
  getCompanyActivityTypes,
  getLocalizationMessagesByKeys,
} from '@azzapp/data';
import { DEFAULT_LOCALE } from '@azzapp/i18n';
import CompanyActivitiesTypesList from './CompanyActivitiesTypesList';

export type CompanyActivityTypeItem = {
  id: string;
  label: string | null;
};

const CompanyActivitiesTypesPage = async () => {
  const companyActivitiesTypes = await getCompanyActivityTypes();
  const labels = await getLocalizationMessagesByKeys(
    companyActivitiesTypes.map(cat => cat.id),
    DEFAULT_LOCALE,
  );

  const labelsMap = labels.reduce(
    (acc, label) => {
      if (label) {
        acc[label.key] = label.value;
      }
      return acc;
    },
    {} as Record<string, string>,
  );

  const items = companyActivitiesTypes.map(cat => ({
    id: cat.id,
    label: labelsMap[cat.id] || cat.id,
  }));

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        Activities Types
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
        value="Activities types are used to group different activities in the activity list view"
      />
      <CompanyActivitiesTypesList companyActivitiesTypes={items} />
    </Box>
  );
};

export default CompanyActivitiesTypesPage;
