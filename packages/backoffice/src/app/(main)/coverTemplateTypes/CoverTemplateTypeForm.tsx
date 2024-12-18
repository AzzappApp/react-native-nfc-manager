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
import { saveCoverTemplateType } from './coverTemplateTypesActions';
import type { WebCardCategoryErrors } from '../webCardCategories/webCardCategorySchema';
import type { CoverTemplateType } from '@azzapp/data';
import type { FormEvent } from 'react';

type Props = {
  label?: string;
  coverTemplateType: CoverTemplateType | null;
  saved?: boolean;
};

type FormValue = CoverTemplateType & { label: string };

const CoverTemplateTypeForm = ({
  label,
  coverTemplateType,
  saved = false,
}: Props) => {
  const isCreation = !coverTemplateType;
  const [displaySaveSuccess, setDisplaySaveSuccess] = useState(saved);
  const [error, setError] = useState<string>();
  const [saving, startSaving] = useTransition();
  const [formErrors, setFormErrors] = useState<WebCardCategoryErrors | null>(
    null,
  );
  const router = useRouter();

  const { data, fieldProps } = useForm<FormValue>(
    () =>
      coverTemplateType
        ? {
            ...coverTemplateType,
            label,
          }
        : { enabled: true },
    formErrors?.fieldErrors,
    [coverTemplateType],
  );

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    startSaving(async () => {
      const result = await saveCoverTemplateType(data as FormValue);

      setFormErrors(null);
      if (result.success && isCreation) {
        router.replace(
          `/coverTemplateTypes/${result.coverTemplateTypeId}?saved=true`,
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
          href="/coverTemplateTypes"
        >
          <People sx={{ mr: 0.5 }} fontSize="inherit" />
          Cover template type
        </Link>
      </Breadcrumbs>
      <Typography variant="h4" component="h1">
        {coverTemplateType ? label : 'New Cover Template Type'}
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

export default CoverTemplateTypeForm;
