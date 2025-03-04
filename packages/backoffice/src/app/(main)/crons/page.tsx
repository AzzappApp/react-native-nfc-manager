'use client';

import { Box, Button, Stack, TextField, Tooltip } from '@mui/material';
import Snackbar from '@mui/material/Snackbar';
import { useState } from 'react';
import { removeUnusedMedia, unpublishWebCards } from './actions';

const Crons = () => {
  const [message, setMessage] = useState<string | null>(null);

  const [running, setRunning] = useState<'unpublish' | 'unusedMedia' | null>(
    null,
  ); //to be replaced with useActionState with next 15

  return (
    <Stack spacing={5}>
      <TextField
        id="note"
        slotProps={{
          htmlInput: {
            readOnly: true,
          },
        }}
        label="Note"
        multiline
        rows={1}
        maxRows={3}
        value="These crons are periodically run in production. These buttons help for testing on dev and staging environment"
      />
      <Box>
        <Tooltip title="Find all WebCards with expired subscription and unpublish them">
          <Button
            variant="contained"
            disabled={running === 'unpublish'}
            loading={running === 'unpublish'}
            onClick={async () => {
              setRunning('unpublish');
              try {
                await unpublishWebCards();
                setMessage(
                  'WebCards have been published successfully (if many, it may need a new run, they are treated in batches)',
                );
              } catch (err) {
                setMessage(`An error occurred ${err}`);
              } finally {
                setRunning(null);
              }
            }}
          >
            Run unpublish webcards
          </Button>
        </Tooltip>
      </Box>
      <Box>
        <Tooltip title="Find all unused media and remove them">
          <Button
            variant="contained"
            disabled={running === 'unusedMedia'}
            loading={running === 'unusedMedia'}
            onClick={async () => {
              setRunning('unusedMedia');
              try {
                await removeUnusedMedia();
                setMessage(
                  'Unused media have been removed successfully (if many, it may need a new run, they are treated in batches)',
                );
              } catch (err) {
                setMessage(`An error occurred ${err}`);
              } finally {
                setRunning(null);
              }
            }}
          >
            Run remove unused media
          </Button>
        </Tooltip>
      </Box>
      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        open={!!message}
        onClose={() => {
          setMessage(null);
        }}
        message={message}
      />
    </Stack>
  );
};

export default Crons;
