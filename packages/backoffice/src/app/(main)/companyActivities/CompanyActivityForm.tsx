'use client';

import { People } from '@mui/icons-material';
import {
  Box,
  Breadcrumbs,
  Button,
  Link,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from '#helpers/formHelpers';
import TypeListInput from '../../../components/TypeListInput';
import { saveCompanyActivity } from './companyActivityActions';
import type { CompanyActivityErrors } from './companyActivitySchema';
import type {
  CompanyActivity,
  CardTemplateType,
  Label,
  CompanyActivityType,
} from '@azzapp/data';

type CompanyActivityFormProps = {
  companyActivity?: CompanyActivity | null;
  cardTemplateTypes: CardTemplateType[];
  companyActivitiesTypes: CompanyActivityType[];
  saved?: boolean;
  label?: Label | null;
  cardTemplateTypesLabels: Label[];
  companyActivityTypesLabels: Label[];
};

type FormValue = CompanyActivity &
  Label & {
    cardTemplateType: CardTemplateType | string;
    companyActivityType: CompanyActivityType | string;
  };

const CompanyActivityForm = ({
  companyActivity,
  saved = false,
  cardTemplateTypes,
  companyActivitiesTypes,
  label,
  cardTemplateTypesLabels,
  companyActivityTypesLabels,
}: CompanyActivityFormProps) => {
  const isCreation = !companyActivity;
  const [saving, setIsSaving] = useState(false);
  const [displaySaveSuccess, setDisplaySaveSuccess] = useState(saved);
  const [error, setError] = useState<string>();
  const [formErrors, setFormErrors] = useState<CompanyActivityErrors | null>(
    null,
  );

  const { data, fieldProps } = useForm<FormValue>(
    () => ({
      ...label,
      ...companyActivity,
      cardTemplateType: companyActivity?.cardTemplateTypeId
        ? cardTemplateTypes?.find(item => {
            return item.id === companyActivity?.cardTemplateTypeId;
          })
        : undefined,
      companyActivityType: companyActivity?.companyActivityTypeId
        ? companyActivitiesTypes?.find(item => {
            return item.id === companyActivity?.companyActivityTypeId;
          })
        : undefined,
    }),
    formErrors?.fieldErrors,
    [companyActivity],
  );

  const router = useRouter();
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const result = await saveCompanyActivity(data as CompanyActivity);
    if (result.success) {
      setFormErrors(null);
      if (isCreation) {
        router.replace(
          `/companyActivities/${result.companyActivityId}?saved=true`,
        );
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
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 2,
      }}
      component="form"
      onSubmit={handleSubmit}
    >
      <Breadcrumbs aria-label="breadcrumb">
        <Link
          underline="hover"
          sx={{ display: 'flex', alignItems: 'center' }}
          color="inherit"
          href="/companyActivities"
        >
          <People sx={{ mr: 0.5 }} fontSize="inherit" />
          Activities
        </Link>
      </Breadcrumbs>
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        {companyActivity
          ? `Company activity ${label?.baseLabelValue}`
          : 'New Company Activity'}
      </Typography>

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          width: '100%',
          mb: 2,
        }}
      >
        <TextField
          name="labelKey"
          label="Label Key"
          disabled={saving || !isCreation}
          required
          sx={{ flex: 1, minWidth: 200 }}
          {...fieldProps('labelKey')}
        />
        <TextField
          name="baseLabelValue"
          label="Label base value"
          required
          sx={{ flex: 1, minWidth: 200 }}
          {...fieldProps('baseLabelValue')}
        />
      </Box>
      <TypeListInput
        label="Webcard template type"
        name="cardTemplateType"
        options={cardTemplateTypes}
        typesLabels={cardTemplateTypesLabels}
        sx={{ flex: 1, minWidth: 200 }}
        {...fieldProps('cardTemplateType')}
      />
      <TypeListInput
        label="Activity Type"
        name="companyActivityType"
        options={companyActivitiesTypes}
        typesLabels={companyActivityTypesLabels}
        sx={{ flex: 1, minWidth: 200 }}
        {...fieldProps('companyActivityType')}
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
      <Snackbar
        open={displaySaveSuccess}
        onClose={() => setDisplaySaveSuccess(false)}
        autoHideDuration={6000}
        message="Company Activity saved"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default CompanyActivityForm;
