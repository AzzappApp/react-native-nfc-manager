'use client';

import { People } from '@mui/icons-material';
import {
  Box,
  Breadcrumbs,
  Button,
  FormControlLabel,
  Link,
  Snackbar,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import omit from 'lodash/omit';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { intParser, useForm } from '#helpers/formHelpers';
import { saveCoverTemplateTag } from './coverTemplateTagsActions';
import type { CoverTemplateTag } from '@azzapp/data';
import type { FormEvent } from 'react';

type Props = {
  label?: string;
  description?: string;
  coverTemplateTag: CoverTemplateTag | null;
  saved?: boolean;
};

type FormValue = CoverTemplateTag & { label: string; description?: string };

const CoverTemplateTagForm = ({
  label,
  description,
  coverTemplateTag,
  saved = false,
}: Props) => {
  const isCreation = !coverTemplateTag;
  const [displaySaveSuccess, setDisplaySaveSuccess] = useState(saved);
  const [error, setError] = useState<string>();
  const [saving, startSaving] = useTransition();
  const router = useRouter();
  const [formErrors, setFormErrors] = useState<any>(null);

  const { data, fieldProps } = useForm<FormValue>(
    () =>
      coverTemplateTag
        ? {
            ...coverTemplateTag,
            label,
            description,
          }
        : { enabled: true },
    formErrors?.fieldErrors,
    [coverTemplateTag],
  );

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    startSaving(async () => {
      const result = await saveCoverTemplateTag(data as FormValue);

      setFormErrors(null);
      if (result.success && isCreation) {
        router.replace(
          `/coverTemplateFilters/${result.coverTemplateTagId}?saved=true`,
        );
      } else if (result.success) {
        setDisplaySaveSuccess(true);
      } else if (!result.success) {
        setFormErrors(result.formErrors || null);
        setError(result.message);
      }
    });
  };

  return (
    <>
      <Breadcrumbs aria-label="breadcrumb">
        <Link
          underline="hover"
          sx={{ display: 'flex', alignItems: 'center' }}
          color="inherit"
          href="/coverTemplateFilters"
        >
          <People sx={{ mr: 0.5 }} fontSize="inherit" />
          Cover template filters
        </Link>
      </Breadcrumbs>
      <Typography variant="h4" component="h1">
        {coverTemplateTag ? label : 'New Cover Template Tag'}
      </Typography>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          padding: 2,
        }}
        component="form"
        onSubmit={handleSubmit}
      >
        <Box>
          <FormControlLabel
            control={
              <Switch
                name="enabled"
                checked={!!data.enabled}
                disabled={saving}
                {...omit(
                  fieldProps('enabled', { format: value => value ?? null }),
                  'error',
                  'helperText',
                )}
              />
            }
            label="Enabled"
          />
        </Box>
        <Box display="flex" flexDirection="row" gap={1}>
          <TextField
            name="label"
            label="Label (en-US)"
            disabled={saving}
            required
            fullWidth
            {...fieldProps('label')}
          />
          <TextField
            name="fontSize"
            label="description"
            disabled={saving}
            required
            fullWidth
            {...fieldProps('description')}
          />
          <Box display="flex" alignItems="center" gap={2} width="100%">
            <TextField
              name="fontSize"
              type="number"
              label="Order"
              disabled={saving}
              required
              fullWidth
              {...fieldProps('order', { parse: intParser })}
            />
          </Box>
        </Box>
        <Box>
          <Button
            type="submit"
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={saving}
          >
            Save
          </Button>
        </Box>
        {error && (
          <Typography variant="body1" color="error">
            {error}
          </Typography>
        )}
      </Box>
      <Snackbar
        open={displaySaveSuccess}
        onClose={() => setDisplaySaveSuccess(false)}
        autoHideDuration={6000}
        message="Cover Template Type saved"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  );
};

export default CoverTemplateTagForm;
