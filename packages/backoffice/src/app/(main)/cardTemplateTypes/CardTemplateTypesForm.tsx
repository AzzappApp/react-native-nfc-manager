'use client';

import { PhoneIphone } from '@mui/icons-material';
import {
  Autocomplete,
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
import { omit } from 'lodash';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from '#helpers/formHelpers';
import { saveCardTemplateType } from './cardTemplateTypesActions';
import type { CardTemplateTypeErrors } from './cardTemplateTypeSchema';
import type { CardTemplateType, Label, WebCardCategory } from '@azzapp/data';

type CardTemplateTypeFormProps = {
  cardTemplateType?: CardTemplateType | null;
  webCardCategories: WebCardCategory[];
  saved?: boolean;
  label?: Label | null;
  webCardCategoriesLabels: Label[];
};

type FormValue = CardTemplateType &
  Label & {
    webCardCategory: WebCardCategory;
  };

const CardTemplateTypeForm = ({
  cardTemplateType,
  saved = false,
  webCardCategories,
  label,
  webCardCategoriesLabels,
}: CardTemplateTypeFormProps) => {
  const isCreation = !cardTemplateType;
  const [saving, setIsSaving] = useState(false);
  const [displaySaveSuccess, setDisplaySaveSuccess] = useState(saved);
  const [error, setError] = useState<any>(null);
  const [formErrors, setFormErrors] = useState<CardTemplateTypeErrors | null>(
    null,
  );

  const { data, fieldProps } = useForm<FormValue>(
    () => ({
      ...cardTemplateType,
      labelKey: label?.labelKey || '',
      baseLabelValue: label?.baseLabelValue || '',
      enabled: cardTemplateType?.enabled || false,
      webCardCategory: cardTemplateType?.webCardCategoryId
        ? webCardCategories?.find(item => {
            return item.id === cardTemplateType?.webCardCategoryId;
          })
        : undefined,
    }),
    formErrors?.fieldErrors,
    [saveCardTemplateType],
  );

  const router = useRouter();
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const result = await saveCardTemplateType(data as FormValue);
    console.log(result);

    if (result.success) {
      setFormErrors(null);
      if (isCreation) {
        router.replace(`/cardTemplateTypes/${result.id}?saved=true`);
      } else {
        setDisplaySaveSuccess(true);
      }
    } else if (!result.success) {
      setFormErrors(result.formErrors || null);
      setError(result.message);
    }
    setIsSaving(false);
  };

  return (
    <>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link
          underline="hover"
          sx={{ display: 'flex', alignItems: 'center' }}
          color="inherit"
          href="/cardTemplateTypes"
        >
          <PhoneIphone sx={{ mr: 0.5 }} fontSize="inherit" />
          WebCards templates type
        </Link>
      </Breadcrumbs>
      <Typography variant="h4" component="h1" sx={{ mb: 4 }}>
        {cardTemplateType
          ? `Card Template Type ${label?.baseLabelValue}`
          : 'New Card Template Type'}
      </Typography>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 2,
          padding: 2,
        }}
        maxWidth={600}
        component="form"
        onSubmit={handleSubmit}
      >
        <FormControlLabel
          control={
            <Switch
              name="enabled"
              checked={!!data.enabled}
              disabled={saving}
              {...omit(
                fieldProps('enabled', {
                  format: value => value ?? null,
                }),
                'error',
                'helperText',
              )}
            />
          }
          label="Enabled"
        />

        <Box display="flex" gap={2}>
          <TextField
            name="labelKey"
            label="Label Key"
            disabled={saving || !isCreation}
            required
            sx={{ width: 300 }}
            {...fieldProps('labelKey')}
          />
          <TextField
            name="baseLabelValue"
            label="Label default value"
            required
            sx={{ width: 300 }}
            {...fieldProps('baseLabelValue')}
          />
        </Box>
        <Autocomplete
          sx={{ width: 300 }}
          multiple={false}
          id="profile-categories"
          options={webCardCategories}
          getOptionLabel={option => {
            const label = webCardCategoriesLabels.find(
              item => item.labelKey === option.labelKey,
            );

            return label?.baseLabelValue ?? option.labelKey;
          }}
          value={fieldProps('webCardCategory').value as WebCardCategory}
          onChange={(_, value) => {
            fieldProps('webCardCategory').onChange(value as WebCardCategory);
          }}
          renderInput={params => (
            <TextField
              {...params}
              variant="outlined"
              label="Profile categories"
            />
          )}
          renderOption={(props, option) => {
            const label = option.labelKey;
            return (
              <li {...props} key={option.id}>
                {label}
              </li>
            );
          }}
        />

        <Button
          type="submit"
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          disabled={saving}
        >
          Save
        </Button>
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
        message="Card Template Type saved"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  );
};

export default CardTemplateTypeForm;
