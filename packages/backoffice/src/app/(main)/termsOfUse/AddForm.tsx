'use client';

import { Box, Button, TextField } from '@mui/material';
import { useCallback, useState } from 'react';
import { createNewVersion } from './actions';

const AddForm = () => {
  const [error, setError] = useState(false);
  const [version, setVersion] = useState('');

  const onCreate = useCallback(async () => {
    try {
      await createNewVersion(version);
      location.reload();
    } catch (e) {
      console.error(e);
      setError(true);
    }
  }, [version]);

  return (
    <Box display="flex" alignItems="center" gap={5}>
      <TextField
        id="note"
        label="New version"
        value={version}
        error={error}
        onChange={val => {
          setVersion(val.target.value);
        }}
      />
      <Button variant="contained" onClick={onCreate}>
        Create
      </Button>
    </Box>
  );
};

export default AddForm;
