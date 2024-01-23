'use client';

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
} from '@mui/material';
import { omit } from 'lodash';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import { encodeMediaId } from '@azzapp/shared/imagesHelpers';
import { uploadMedia } from '@azzapp/shared/WebAPI';
import { getSignedUpload } from '#app/mediaActions';
import MediasListInput from '#components/MediasListInput';
import { intParser, labelsOptions, useForm } from '#helpers/formHelpers';
import WebCardTemplateTypeListInput from '../companyActivities/WebCardTemplateTypeListInput';
import ActivityListInput from './ActivityListInput';
import { saveWebCardCategory } from './webCardCategoriesActions';
import type { WebCardCategoryErrors } from './webCardCategorySchema';
import type {
  CardTemplateType,
  CompanyActivity,
  WebCardCategory,
} from '@azzapp/data/domains';

type WebCardCategoryFormProps = {
  webCardCategory?: WebCardCategory | null;
  companyActivities: CompanyActivity[];
  cardTemplateTypes: CardTemplateType[];
  categoryCompanyActivities?: string[];
  saved?: boolean;
};

type FormValue = Omit<WebCardCategory, 'medias'> & {
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
}: WebCardCategoryFormProps) => {
  const isCreation = !webCardCategory;
  const [saving, setIsSaving] = useState(false);
  const [displaySaveSuccess, setDisplaySaveSuccess] = useState(saved);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [formErrors, setFormErrors] = useState<WebCardCategoryErrors | null>(
    null,
  );
  const { data, fieldProps } = useForm<FormValue>(
    () =>
      webCardCategory
        ? {
            ...webCardCategory,
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
                id: encodeMediaId(public_id, 'image'),
                index: mediaIndex,
              }),
            );
          }),
        );
      } catch (error) {
        setError(error);
        setIsSaving(false);
        setUploading(false);
        return;
      }

      uploads.forEach(({ id, index }) => {
        mediasToSave[index] = id;
      });
      setUploading(false);
    }

    try {
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
      } else {
        setFormErrors(result.formErrors);
      }
    } catch (error) {
      setFormErrors(null);
      setError(error);
    }
    setIsSaving(false);
  };

  const webCardKindProps = fieldProps('webCardKind');

  return (
    <>
      <Typography variant="h4" component="h1" sx={{ mb: 10 }}>
        {webCardCategory
          ? `WebCardCategory : ${webCardCategory.labels.en}`
          : 'New WebCardCategory'}
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
          disabled={saving}
          required
          {...fieldProps('labels', labelsOptions)}
        />
        <FormControl fullWidth error={webCardKindProps.error}>
          <InputLabel id="webCardKind-label">Profile Kind</InputLabel>
          <Select
            labelId={'webCardKind-label'}
            id="webCardKind"
            name="webCardKind"
            value={webCardKindProps.value}
            label="Profile Kind"
            onChange={webCardKindProps.onChange as any}
          >
            <MenuItem value="personal">Personal</MenuItem>
            <MenuItem value="business">Business</MenuItem>
          </Select>
          <FormHelperText>{webCardKindProps.helperText}</FormHelperText>
        </FormControl>
        <TextField
          name="fontSize"
          type="number"
          label="Order"
          disabled={saving}
          required
          {...fieldProps('order', { parse: intParser })}
        />
        <WebCardTemplateTypeListInput
          label="Webcard template type"
          name="cardTemplateType"
          options={cardTemplateTypes}
          {...fieldProps('cardTemplateType')}
        />
        {data.webCardKind === 'business' && (
          <ActivityListInput
            label="Activities"
            name="activities"
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
