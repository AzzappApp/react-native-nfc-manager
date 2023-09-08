'use client';

import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogContent,
  Pagination,
  TextField,
  Typography,
} from '@mui/material';
import { experimental_useOptimistic, useState } from 'react';
import {
  encodeMediaId,
  getImageURLForSize,
  getVideoURL,
} from '@azzapp/shared/imagesHelpers';
import { uploadMedia } from '@azzapp/shared/WebAPI';
import { getSignedUpload } from '#app/mediaActions';
import ItemWithLabelSelectionList from './ItemWithLabelSelectionList';
import {
  addSuggestions,
  setSuggestionsForMedia,
} from './suggestedMediasActions';
import SuggesionAddForm from './SuggestionAddForm';
import type { CompanyActivity, ProfileCategory } from '@azzapp/data/domains';

type MediaSuggestionsListProps = {
  activities: CompanyActivity[];
  categories: ProfileCategory[];
  mediasSuggestions: Record<
    string,
    {
      kind: 'image' | 'video';
      activities: Record<string, boolean>;
      categories: Record<string, boolean>;
    }
  >;
};

const MediaSuggestionsList = ({
  activities,
  categories,
  mediasSuggestions,
}: MediaSuggestionsListProps) => {
  const itemsPerPage = 15;
  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] =
    useState<ProfileCategory | null>(null);
  const [selectedActivity, setSelectedActivity] =
    useState<CompanyActivity | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saveError, setSaveError] = useState<any>(null);

  const [optimisticSuggestions, setLocalSuggestions] =
    experimental_useOptimistic<
      typeof mediasSuggestions,
      {
        mediaId: string;
        categories: string[];
        activities: string[];
      }
    >(mediasSuggestions, (state, { mediaId, categories, activities }) => ({
      ...state,
      [mediaId]: {
        ...state[mediaId],
        categories: categories.reduce(
          (acc, category) => ({ ...acc, [category]: true }),
          {},
        ),
        activities: activities.reduce(
          (acc, activity) => ({ ...acc, [activity]: true }),
          {},
        ),
      },
    }));

  const saveMedias = async (
    medias: File[],
    categories: string[],
    activities: string[],
  ) => {
    setUploading(true);
    try {
      const mediaToUploads = await Promise.all(
        medias.map(async media => {
          const kind: 'image' | 'video' = media.type.startsWith('image')
            ? 'image'
            : 'video';
          return {
            media,
            kind,
            ...(await getSignedUpload(kind)),
          };
        }),
      );

      const uploadedMedias = await Promise.all(
        mediaToUploads.map(
          async ({ media, kind, uploadParameters, uploadURL }) => {
            const { public_id } = await uploadMedia(
              media,
              uploadURL,
              uploadParameters,
            ).promise;
            return encodeMediaId(public_id, kind);
          },
        ),
      );

      await addSuggestions({
        medias: uploadedMedias,
        categories,
        activities,
      });
    } catch (error) {
      setUploading(false);
      setSaveError(error);
      return;
    }

    setUploading(false);
    setShowAddForm(false);
  };

  const onSuggestionsChange = async (
    mediaId: string,
    categories: string[],
    activities: string[],
  ) => {
    setLocalSuggestions({
      mediaId,
      categories,
      activities,
    });
    await setSuggestionsForMedia({ mediaId, categories, activities });
  };

  const suggestions = Object.entries(optimisticSuggestions)
    .filter(([_, { activities, categories }]) => {
      if (selectedCategory) {
        if (!categories[selectedCategory.id]) {
          return false;
        }
      }
      if (selectedActivity) {
        if (!activities[selectedActivity.id]) {
          return false;
        }
      }
      return true;
    })
    .map(
      ([
        mediaId,
        {
          kind,
          activities: selectedActivities,
          categories: selectedCategories,
        },
      ]) => {
        return {
          mediaId,
          kind,
          selectedActivities: Object.keys(selectedActivities),
          selectedCategories: Object.keys(selectedCategories),
        };
      },
    );

  return (
    <>
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        Cover Suggestions
      </Typography>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            padding: 2,
            borderBottom: '1px solid black',
          }}
        >
          <Autocomplete
            value={selectedCategory}
            options={categories}
            getOptionLabel={option => option.labels.en}
            renderInput={params => (
              <TextField {...params} label="Filter by category" />
            )}
            sx={{ width: 300 }}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                {option.labels.en}
              </li>
            )}
            onChange={(_, value) => setSelectedCategory(value)}
          />
          <Autocomplete
            value={selectedActivity}
            options={activities}
            getOptionLabel={option => option.labels.en}
            renderInput={params => (
              <TextField {...params} label="Filter by activity" />
            )}
            sx={{ width: 300 }}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                {option.labels.en}
              </li>
            )}
            onChange={(_, value) => setSelectedActivity(value)}
          />

          <div style={{ flexGrow: 1 }} />
          <Button
            component="label"
            variant="outlined"
            color="primary"
            onClick={() => setShowAddForm(true)}
          >
            + Add suggestion
          </Button>
        </Box>
        <Box component="span">
          <Pagination
            count={Math.ceil(suggestions.length / itemsPerPage)}
            page={page}
            onChange={(_, page) => setPage(page)}
            defaultPage={1}
            color="primary"
            size="large"
            showFirstButton
            showLastButton
          />
        </Box>
        {suggestions
          .slice((page - 1) * itemsPerPage, page * itemsPerPage)
          .map(({ mediaId, kind, selectedActivities, selectedCategories }) => (
            <SuggestionRenderer
              key={mediaId}
              mediaId={mediaId}
              kind={kind}
              activities={activities}
              categories={categories}
              selectedActivities={selectedActivities}
              selectedCategories={selectedCategories}
              onChange={(categories, activities) => {
                void onSuggestionsChange(mediaId, categories, activities);
              }}
            />
          ))}
      </Box>

      <SuggesionAddForm
        categories={categories}
        activities={activities}
        open={showAddForm}
        onClose={() => setShowAddForm(false)}
        error={saveError}
        onAdd={saveMedias}
      />

      <Dialog
        open={uploading}
        sx={{
          zIndex: 10000,
        }}
      >
        <DialogContent>Uploading ...</DialogContent>
      </Dialog>
    </>
  );
};

export default MediaSuggestionsList;

type SuggestionRendererProps = {
  mediaId: string;
  kind: 'image' | 'video';
  categories: ProfileCategory[];
  selectedCategories: string[];
  activities: CompanyActivity[];
  selectedActivities: string[];
  onChange?: (categories: string[], activities: string[]) => void;
};

const SuggestionRenderer = ({
  mediaId,
  kind,
  categories,
  selectedCategories,
  activities,
  selectedActivities,
  onChange,
}: SuggestionRendererProps) => {
  const onActivitiesChange = (selectedActivities: Set<string>) => {
    onChange?.(selectedCategories, [...selectedActivities]);
  };

  const onCategoriesChange = (selectedCategories: Set<string>) => {
    onChange?.([...selectedCategories], selectedActivities);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 2,
        height: 200,
        borderBottom: `1px solid black`,
        padding: 2,
      }}
    >
      {kind === 'video' ? (
        <video src={getVideoURL(mediaId)} />
      ) : (
        <img src={getImageURLForSize(mediaId, null, 600)} />
      )}
      <ItemWithLabelSelectionList
        label="Profile Categories"
        options={categories}
        selectedOptions={new Set(selectedCategories)}
        onChange={onCategoriesChange}
      />
      <ItemWithLabelSelectionList
        label="Activities"
        options={activities}
        selectedOptions={new Set(selectedActivities)}
        onChange={onActivitiesChange}
      />
    </Box>
  );
};
