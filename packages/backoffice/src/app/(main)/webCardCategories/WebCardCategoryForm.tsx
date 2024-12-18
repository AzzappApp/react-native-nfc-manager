'use client';

import { People } from '@mui/icons-material';
import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
  Dialog,
  DialogContent,
  Snackbar,
  Breadcrumbs,
  Link,
} from '@mui/material';
import omit from 'lodash/omit';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import { uploadMedia } from '@azzapp/shared/WebAPI';
import { getSignedUpload } from '#app/mediaActions';
import MediasListInput from '#components/MediasListInput';
import { intParser, useForm } from '#helpers/formHelpers';
import TypeListInput from '../../../components/TypeListInput';
import ActivityListInput from './ActivityListInput';
import { saveWebCardCategory } from './webCardCategoriesActions';
import type { WebCardCategoryErrors } from './webCardCategorySchema';
import type {
  CardTemplateType,
  CompanyActivity,
  LocalizationMessage,
  WebCardCategory,
} from '@azzapp/data';

type WebCardCategoryFormProps = {
  webCardCategory?: WebCardCategory | null;
  companyActivities: CompanyActivity[];
  cardTemplateTypes: CardTemplateType[];
  categoryCompanyActivities?: string[];
  saved?: boolean;
  labels: LocalizationMessage[];
};

type FormValue = Omit<WebCardCategory, 'medias'> & {
  label: string;
  medias: Array<File | string>;
  activities: Array<CompanyActivity | string>;
  cardTemplateType: CardTemplateType | string;
};

const WebCardCategoryForm = ({
  webCardCategory,
  companyActivities,
  cardTemplateTypes,
  categoryCompanyActivities,
  saved = false,
  labels,
}: WebCardCategoryFormProps) => {
  const isCreation = !webCardCategory;
  const [saving, setIsSaving] = useState(false);
  const [displaySaveSuccess, setDisplaySaveSuccess] = useState(saved);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>();
  const [formErrors, setFormErrors] = useState<WebCardCategoryErrors | null>(
    null,
  );

  const label = useMemo(
    () =>
      webCardCategory
        ? labels.find(label => label.key === webCardCategory?.id)?.value
        : '',
    [labels, webCardCategory],
  );

  const { data, fieldProps } = useForm<FormValue>(
    () =>
      webCardCategory
        ? {
            ...webCardCategory,
            label,
            activities:
              categoryCompanyActivities?.map(
                id =>
                  companyActivities.find(activity => activity.id === id) ?? id,
              ) ?? [],
            cardTemplateType: webCardCategory?.cardTemplateTypeId
              ? cardTemplateTypes?.find(item => {
                  return item.id === webCardCategory?.cardTemplateTypeId;
                })
              : undefined,
          }
        : { enabled: true },
    formErrors?.fieldErrors,
    [webCardCategory, categoryCompanyActivities],
  );

  const router = useRouter();
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const medias = data?.medias ?? [];
    const mediasToSave: string[] = [];

    const mediasToUpload = convertToNonNullArray(
      medias.map((media, index) => {
        if (typeof media === 'string') {
          mediasToSave[index] = media;
          return null;
        }
        return {
          index,
          file: media,
        };
      }),
    );

    if (mediasToUpload.length > 0) {
      setUploading(true);

      let uploads: Array<{ id: string; index: number }>;
      try {
        const uploadsInfos = await Promise.all(
          mediasToUpload.map(() => getSignedUpload('image', 'cover')),
        );

        uploads = await Promise.all(
          mediasToUpload.map(({ file, index: mediaIndex }, index) => {
            const { uploadURL, uploadParameters } = uploadsInfos[index];
            return uploadMedia(file, uploadURL, uploadParameters).promise.then(
              ({ public_id }) => ({
                id: public_id,
                index: mediaIndex,
              }),
            );
          }),
        );
      } catch (error: any) {
        setError(error.message);
        setIsSaving(false);
        setUploading(false);
        return;
      }

      uploads.forEach(({ id, index }) => {
        mediasToSave[index] = id;
      });
      setUploading(false);
    }

    const result = await saveWebCardCategory({
      ...data,
      medias: mediasToSave,
    } as any);

    if (result.success) {
      setFormErrors(null);
      if (isCreation) {
        router.replace(
          `/webCardCategories/${result.webCardCategoryId}?saved=true`,
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

  const webCardKindProps = fieldProps('webCardKind');

  return (
    <>
      <Breadcrumbs aria-label="breadcrumb">
        <Link
          underline="hover"
          sx={{ display: 'flex', alignItems: 'center' }}
          color="inherit"
          href="/webCardCategories"
        >
          <People sx={{ mr: 0.5 }} fontSize="inherit" />
          Categories
        </Link>
      </Breadcrumbs>
      <Typography variant="h4" component="h1">
        {webCardCategory ? label : 'New WebCardCategory'}
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
        <TextField
          name="label"
          label="Label (en-US)"
          disabled={saving}
          required
          fullWidth
          {...fieldProps('label')}
        />
        <Box display="flex" alignItems="center" gap={2} width="100%">
          <FormControl fullWidth error={webCardKindProps.error}>
            <InputLabel id="webCardKind-label">Profile Kind</InputLabel>
            <Select
              labelId={'webCardKind-label'}
              id="webCardKind"
              name="webCardKind"
              value={webCardKindProps.value}
              label="WebCard Kind"
              onChange={webCardKindProps.onChange as any}
            >
              <MenuItem value="personal">Personal</MenuItem>
              <MenuItem value="business">Business</MenuItem>
            </Select>
            <FormHelperText>{webCardKindProps.helperText}</FormHelperText>
          </FormControl>
        </Box>
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
          <TypeListInput
            label="Webcard template type"
            name="cardTemplateType"
            options={cardTemplateTypes}
            typesLabels={labels}
            width="100%"
            {...fieldProps('cardTemplateType')}
          />
        </Box>
        {data.webCardKind === 'business' && (
          <ActivityListInput
            label="Activities"
            name="activities"
            activityLabels={labels}
            options={companyActivities}
            {...fieldProps('activities')}
          />
        )}
        <MediasListInput
          label="Medias"
          name="medias"
          accept="image/jpeg"
          {...fieldProps('medias')}
        />
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
      <Dialog open={uploading}>
        <DialogContent>Uploading ...</DialogContent>
      </Dialog>
      <Snackbar
        open={displaySaveSuccess}
        onClose={() => setDisplaySaveSuccess(false)}
        autoHideDuration={6000}
        message="WebCardCategory saved"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  );
};

export default WebCardCategoryForm;
