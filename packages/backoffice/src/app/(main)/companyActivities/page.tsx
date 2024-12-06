import { Box, TextField, Typography } from '@mui/material';
import {
  getCompanyActivities,
  getLocalizationMessagesByLocale,
} from '@azzapp/data';
import { DEFAULT_LOCALE } from '@azzapp/i18n';
import CompanyActivitiesList from './CompanyActivitiesList';

const CompanyActivitiesPage = async () => {
  const [companyActivities, labels] = await Promise.all([
    getCompanyActivities(),
    getLocalizationMessagesByLocale(DEFAULT_LOCALE),
  ]);
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
        value="Activities will impact the suggested cover template"
      />
      <CompanyActivitiesList
        companyActivities={companyActivities}
        labels={labels}
      />
    </Box>
  );
};

export default CompanyActivitiesPage;
