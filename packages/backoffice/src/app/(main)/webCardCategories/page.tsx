import { Box, TextField, Typography } from '@mui/material';
import {
  getLocalizationMessagesByKeys,
  getWebCardCategories,
} from '@azzapp/data';
import { DEFAULT_LOCALE } from '@azzapp/i18n';
import WebCardCategoriesList from './WebCardCategoriesList';

const WebCardCategoriesPage = async () => {
  const webCardCategories = await getWebCardCategories(false);
  const labels = await getLocalizationMessagesByKeys(
    webCardCategories.map(c => c.id),
    DEFAULT_LOCALE,
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
        Categories
      </Typography>
      <TextField
        id="note"
        inputProps={{
          readOnly: true,
        }}
        label="Note"
        multiline
        rows={3}
        maxRows={4}
        value={
          'Categories of the WebCard are at the top level, it defines the kind of WebCard users will create.\nCategories (even disabled) are also used in the WebCard template list view in order to group different Templates types together.'
        }
      />
      <WebCardCategoriesList
        webCardCategories={webCardCategories}
        labels={labels}
      />
    </Box>
  );
};

export default WebCardCategoriesPage;
