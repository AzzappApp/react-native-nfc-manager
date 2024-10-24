import {
  DndContext,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import DragHandle from '@mui/icons-material/DragHandleRounded';
import {
  IconButton,
  Box,
  Typography,
  Autocomplete,
  TextField,
  createFilterOptions,
  Paper,
} from '@mui/material';
import { uniqBy } from 'lodash';
import { useMemo, useRef, useState } from 'react';
import type { CompanyActivity, LocalizationMessage } from '@azzapp/data';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import type { BoxProps } from '@mui/material';

type ActivityListInputProps = Omit<BoxProps, 'onChange'> & {
  name: string;
  label: string;
  value: Array<CompanyActivity | string> | null | undefined;
  options: CompanyActivity[];
  error?: boolean | null;
  helperText?: string | null;
  onChange: (value: Array<CompanyActivity | string>) => void;
  activityLabels: LocalizationMessage[];
};

const ActivityListInput = ({
  name,
  label,
  value,
  error,
  options,
  helperText,
  onChange,
  activityLabels,
  ...props
}: ActivityListInputProps) => {
  const selectedActivities = value ?? [];
  const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor));
  const [activeItem, setActiveItem] = useState<CompanyActivity | string | null>(
    null,
  );

  const [autoCompleteValue, setAutoCompleteValue] = useState<
    CompanyActivity | string | null
  >(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const handleActivitySelect = (value: CompanyActivity | string | null) => {
    setAutoCompleteValue(null);
    inputRef.current?.blur();
    if (!value) {
      return;
    }
    if (typeof value === 'string') {
      value = value.replace(ADD_ACTIVITY_PREFIX, '');
    }
    onChange(uniqBy([...selectedActivities, value], getItemID));
  };

  const handleDelete = (image: CompanyActivity | string) => {
    onChange(selectedActivities.filter(item => item !== image));
  };

  function handleDragStart(event: DragStartEvent) {
    setActiveItem(
      selectedActivities.find(item => getItemID(item) === event.active.id) ??
        null,
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over?.id) {
      onChange(
        arrayMove(
          selectedActivities,
          selectedActivities.findIndex(item => getItemID(item) === active.id),
          selectedActivities.findIndex(item => getItemID(item) === over.id),
        ),
      );
    }

    setActiveItem(null);
  }

  const labelsMap = useMemo(
    () =>
      activityLabels.reduce(
        (acc, label) => {
          acc[label.key] = label.value;
          return acc;
        },
        {} as Record<string, string>,
      ),
    [activityLabels],
  );

  return (
    <Box {...props}>
      <Typography variant="h6">{label}</Typography>
      {error && <Typography color="error">{helperText}</Typography>}
      <Autocomplete
        value={autoCompleteValue}
        options={options as Array<CompanyActivity | string>}
        getOptionLabel={option =>
          typeof option === 'string'
            ? option
            : (labelsMap[option.id] ?? option.id)
        }
        renderInput={params => (
          <TextField {...params} inputRef={inputRef} label="Add an activity" />
        )}
        sx={{ width: 300, paddingBottom: 2 }}
        renderOption={(props, option) => {
          const id = typeof option === 'string' ? option : option.id;
          const label =
            typeof option === 'string' ? option : (labelsMap[id] ?? id);
          return (
            <li {...props} key={id}>
              {label}
            </li>
          );
        }}
        filterOptions={(options, params) => {
          const filtered = filterCompanyActivities(options, params);

          const { inputValue } = params;
          // Suggest the creation of a new value
          const isExisting = options.some(
            option =>
              typeof option === 'object' && inputValue === labelsMap[option.id],
          );
          if (inputValue !== '' && !isExisting) {
            filtered.push(`${ADD_ACTIVITY_PREFIX}${inputValue}`);
          }
          return filtered;
        }}
        onChange={(_, value) => handleActivitySelect(value)}
      />
      <Paper
        sx={{
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto',
          minHeight: 100,
          maxHeight: 400,
          padding: 1,
          gap: 1,
        }}
      >
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          id={`medias-list-${name}`}
        >
          <SortableContext
            items={selectedActivities.map(item => getItemID(item))}
            strategy={verticalListSortingStrategy}
          >
            {selectedActivities.map(item => (
              <SortableItem
                id={getItemID(item)}
                key={getItemID(item)}
                item={item}
                onDelete={handleDelete}
                labelsMap={labelsMap}
              />
            ))}
          </SortableContext>
          <DragOverlay>
            {activeItem && (
              <SortableItem
                id={getItemID(activeItem)}
                item={activeItem}
                onDelete={handleDelete}
                labelsMap={labelsMap}
              />
            )}
          </DragOverlay>
        </DndContext>
      </Paper>
    </Box>
  );
};

export default ActivityListInput;

type SortableItemProps = {
  id: string;
  item: CompanyActivity | string;
  onDelete?: (item: CompanyActivity | string) => void;
  labelsMap: Record<string, string>;
};

export const SortableItem: React.FC<SortableItemProps> = ({
  id,
  item,
  onDelete,
  labelsMap,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <Box
      ref={setNodeRef}
      style={{
        ...style,
        position: 'relative',
        display: 'flex',
        borderRadius: 5,
        padding: 10,
        margin: 2,
        alignItems: 'center',
        backgroundColor: '#F9F9F9',
      }}
    >
      <Box
        {...listeners}
        {...attributes}
        sx={{
          padding: 1,
          marginRight: 1,
          outline: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 1,
          cursor: 'grab',
        }}
      >
        <DragHandle />
      </Box>

      <Typography variant="body1" sx={{ flex: 1 }}>
        {typeof item === 'string' ? item : (labelsMap[item.id] ?? item.id)}
      </Typography>
      <IconButton
        onClick={() => onDelete?.(item)}
        sx={{
          borderRadius: '50%',
        }}
      >
        <DeleteIcon />
      </IconButton>
    </Box>
  );
};

const filterCompanyActivities = createFilterOptions<CompanyActivity | string>();

const getItemID = (item: CompanyActivity | string) =>
  typeof item === 'string' ? item : item.id;

const ADD_ACTIVITY_PREFIX = 'Add activity : ';
