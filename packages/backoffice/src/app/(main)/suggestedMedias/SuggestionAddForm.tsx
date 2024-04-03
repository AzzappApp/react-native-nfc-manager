import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import MediasListInput from '#components/MediasListInput';
import ItemWithLabelSelectionList from './ItemWithLabelSelectionList';
import type { CompanyActivity, WebCardCategory } from '@azzapp/data';

type SuggesionAddFormProps = {
  open: boolean;
  error: any;
  categories: WebCardCategory[];
  activities: CompanyActivity[];
  onClose: () => void;
  onAdd: (medias: File[], categories: string[], activities: string[]) => void;
};

const SuggesionAddForm = ({
  open,
  error,
  categories,
  activities,
  onClose,
  onAdd,
}: SuggesionAddFormProps) => {
  const [medias, setMedias] = useState<File[] | null>(null);
  const [selectedCategories, setSelectedCategories] = useState(
    new Set<string>(),
  );
  const [selectedActivities, setSelectedActivities] = useState(
    new Set<string>(),
  );

  const [mediaErrors, setMediaErrors] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    //
    if (
      !medias?.length ||
      !(selectedCategories.size || selectedActivities.size)
    ) {
      setMediaErrors('Required');
      return;
    }
    onAdd(
      medias,
      [...selectedCategories.values()],
      [...selectedActivities.values()],
    );
  };

  useEffect(() => {
    if (!open) {
      setMedias([]);
      setSelectedCategories(new Set());
      setSelectedActivities(new Set());
      setMediaErrors(null);
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      sx={{ zIndex: 2000 }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          padding: 2,
          maxHeight: '90vh',
        }}
      >
        <DialogTitle>Add Suggested medias</DialogTitle>
        <DialogContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            flex: 1,
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
            accept="image/jpeg,video/mp4"
            name="medias"
            onChange={setMedias as any}
            error={!!mediaErrors}
            helperText={mediaErrors}
          />

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              gap: 2,
              justifyContent: 'space-around',
              flex: 1,
              overflow: 'hidden',
            }}
          >
            <ItemWithLabelSelectionList
              label="Profile Categories"
              selectedOptions={selectedCategories}
              onChange={setSelectedCategories}
              options={categories}
            />
            <Box style={{ width: 1, backgroundColor: '#000' }} />
            <ItemWithLabelSelectionList
              label="Activities"
              selectedOptions={selectedActivities}
              onChange={setSelectedActivities}
              options={activities}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default SuggesionAddForm;
