'use client';

import { Box, Button, Snackbar, TextField, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { labelsOptions, useForm } from '#helpers/formHelpers';
import { saveCompanyActivity } from './companyActivityActions';
import WebCardTemplateTypeListInput from './WebCardTemplateTypeListInput';
import type { CompanyActivityErrors } from './companyActivitySchema';
import type { CompanyActivity, CardTemplateType } from '@azzapp/data';

type CompanyActivityFormProps = {
  companyActivity?: CompanyActivity | null;
  cardTemplateTypes: CardTemplateType[];
  saved?: boolean;
};

type FormValue = CompanyActivity & {
  cardTemplateType: CardTemplateType | string;
};

const CompanyActivityForm = ({
  companyActivity,
  saved = false,
  cardTemplateTypes,
}: CompanyActivityFormProps) => {
  const isCreation = !companyActivity;
  const [saving, setIsSaving] = useState(false);
  const [displaySaveSuccess, setDisplaySaveSuccess] = useState(saved);
  const [error, setError] = useState<any>(null);
  const [formErrors, setFormErrors] = useState<CompanyActivityErrors | null>(
    null,
  );

  const { data, fieldProps } = useForm<FormValue>(
    () =>
      ({
        ...companyActivity,
        cardTemplateType: companyActivity?.cardTemplateTypeId
          ? cardTemplateTypes?.find(item => {
              return item.id === companyActivity?.cardTemplateTypeId;
            })
          : null,
      }) as Partial<CompanyActivity>,
    formErrors?.fieldErrors,
    [companyActivity],
  );

  const router = useRouter();
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const result = await saveCompanyActivity(data as CompanyActivity);
      if (result.success) {
        setFormErrors(null);
        if (isCreation) {
          router.replace(
            `/companyActivities/${result.companyActivityId}?s^aved=true`,
          );
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
        {companyActivity
          ? `Company activity ${companyActivity.labels.en} - ${companyActivity.id}`
          : 'New Company Activity'}
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
          {...fieldProps('labels', labelsOptions)}
        />
        <WebCardTemplateTypeListInput
          label="Webcard template type"
          name="cardTemplateType"
          options={cardTemplateTypes}
          {...fieldProps('cardTemplateType')}
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
        message="Company Activity saved"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  );
};

export default CompanyActivityForm;
