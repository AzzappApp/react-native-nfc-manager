import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import MediasListInput from '#components/MediasListInput';

type ModuleBackgroundAddFormProps = {
  label: string;
  open: boolean;
  error: any;
  handleClose: () => void;
  onAdd: (
    medias: File[],
    resizeMode: 'center' | 'contain' | 'cover' | 'repeat' | 'stretch',
  ) => void;
};

const ModuleBackgroundAddForm = ({
  label,
  open,
  error,
  handleClose,
  onAdd,
}: ModuleBackgroundAddFormProps) => {
  const [medias, setMedias] = useState<File[] | null>(null);
  const [resizeMode, setResizeMode] = useState<
    'center' | 'contain' | 'cover' | 'repeat' | 'stretch'
  >('cover');

  const [mediaErrors, setMediaErrors] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!medias?.length) {
      setMediaErrors('Required');
      return;
    }
    onAdd(medias, resizeMode);
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <Box component="form" onSubmit={handleSubmit} sx={{ padding: 2 }}>
        <DialogTitle>{label}</DialogTitle>
        <DialogContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {error && (
            <Typography variant="body2" color="error">
              Something went wrong {error?.message}
            </Typography>
          )}
          <MediasListInput
            label="Medias"
            value={medias}
            name="medias"
            accept="image/svg+xml"
            onChange={setMedias as any}
            error={!!mediaErrors}
            helperText={mediaErrors}
          />

          <FormControl sx={{ maxWidth: 300 }}>
            <InputLabel id="webCardKind-label">Resize Mode</InputLabel>
            <Select
              labelId={'resizeMode-label'}
              id="resizeMode"
              name="resizeMode"
              value={resizeMode}
              label="Profile Kind"
              onChange={e => setResizeMode(e.target.value as any)}
            >
              <MenuItem value="center">Center</MenuItem>
              <MenuItem value="contain">Contain</MenuItem>
              <MenuItem value="cover">Cover</MenuItem>
              <MenuItem value="repeat">Repeat</MenuItem>
              <MenuItem value="stretch">Stretch</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit" variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default ModuleBackgroundAddForm;
