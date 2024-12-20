import { Box, TextField, Typography } from '@mui/material';
import { getPredefinedCovers } from '@azzapp/data';
import PredefinedCoverList from './PredefinedCoverList';

const PredefinedCoversPage = async () => {
  const covers = await getPredefinedCovers();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        Predefined covers
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
        value="Predefined covers defines a set of cover pick during initial setup"
      />
      <PredefinedCoverList predefinedCovers={covers} />
    </Box>
  );
};

export default PredefinedCoversPage;
