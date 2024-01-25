'use client';

import {
  Autocomplete,
  Box,
  Button,
  FormControlLabel,
  Snackbar,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { omit } from 'lodash';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { labelsOptions, useForm } from '#helpers/formHelpers';
import { saveCardTemplateType } from './cardTemplateTypesActions';
import type { CardTemplateTypeErrors } from './cardTemplateTypeSchema';
import type { CardTemplateType, WebCardCategory } from '@azzapp/data/domains';

type CardTemplateTypeFormProps = {
  cardTemplateType?: CardTemplateType | null;
  webCardCategories: WebCardCategory[];
  saved?: boolean;
};

type FormValue = CardTemplateType & {
  webCardCategory: WebCardCategory;
};

const CardTemplateTypeForm = ({
  cardTemplateType,
  saved = false,
  webCardCategories,
}: CardTemplateTypeFormProps) => {
  const isCreation = !cardTemplateType;
  const [saving, setIsSaving] = useState(false);
  const [displaySaveSuccess, setDisplaySaveSuccess] = useState(saved);
  const [error, setError] = useState<any>(null);
  const [formErrors, setFormErrors] = useState<CardTemplateTypeErrors | null>(
    null,
  );

  const { data, fieldProps } = useForm<FormValue>(
    () =>
      ({
        ...cardTemplateType,
        webCardCategory: cardTemplateType?.webCardCategoryId
          ? webCardCategories?.find(item => {
              return item.id === cardTemplateType?.webCardCategoryId;
            })
          : null,
      }) as Partial<CardTemplateType>,
    formErrors?.fieldErrors,
    [saveCardTemplateType],
  );

  const router = useRouter();
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const result = await saveCardTemplateType(data as FormValue);

      if (result.success) {
        setFormErrors(null);
        if (isCreation) {
          router.replace(`/cardTemplateTypes/${result.id}?saved=true`);
        } else {
          setDisplaySaveSuccess(true);
        }
      } else {
        setFormErrors(result.formErrors);
      }
    } catch (error) {
      setFormErrors(null);
      setError(error);
    }
    setIsSaving(false);
  };

  return (
    <>
      <Typography variant="h4" component="h1" sx={{ mb: 10 }}>
        {cardTemplateType
          ? `Card Template Type ${cardTemplateType.labels.en} - ${cardTemplateType.id}`
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
        maxWidth={500}
        component="form"
        onSubmit={handleSubmit}
      >
        <TextField
          name="label"
          label="Label"
          required
          fullWidth
          {...fieldProps('labels', labelsOptions)}
        />

        <Autocomplete
          fullWidth
          multiple={false}
          id="profile-categories"
          options={webCardCategories}
          getOptionLabel={option => {
            return option.labels.en;
          }}
          value={fieldProps('webCardCategory').value as WebCardCategory}
          onChange={(_, value) => {
            fieldProps('webCardCategory').onChange(value as WebCardCategory);
          }}
          renderInput={params => (
            <TextField
              {...params}
              variant="standard"
              label="Profile categories"
            />
          )}
          renderOption={(props, option) => {
            const label = option.labels.en;
            return (
              <li {...props} key={option.id}>
                {label}
              </li>
            );
          }}
        />
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
            Something went wrong {error?.message}
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
