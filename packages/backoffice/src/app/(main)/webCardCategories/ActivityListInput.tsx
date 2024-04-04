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
} from '@mui/material';
import { uniqBy } from 'lodash';
import { useRef, useState } from 'react';
import type { CompanyActivity, Label } from '@azzapp/data';
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
  activityLabels: Label[];
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

  return (
    <Box {...props}>
      <Typography variant="h6">{label}</Typography>
      {error && <Typography color="error">{helperText}</Typography>}
      <Autocomplete
        value={autoCompleteValue}
        options={options as Array<CompanyActivity | string>}
        getOptionLabel={option =>
          typeof option === 'string' ? option : option.labelKey
        }
        renderInput={params => (
          <TextField {...params} inputRef={inputRef} label="Add an activity" />
        )}
        sx={{ width: 300 }}
        renderOption={(props, option) => {
          const id = typeof option === 'string' ? option : option.id;
          const label = typeof option === 'string' ? option : option.labelKey;
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
              typeof option === 'object' && inputValue === option.labelKey,
          );
          if (inputValue !== '' && !isExisting) {
            filtered.push(`${ADD_ACTIVITY_PREFIX}${inputValue}`);
          }
          return filtered;
        }}
        onChange={(_, value) => handleActivitySelect(value)}
      />
      <Box>
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
                activityLabels={activityLabels}
              />
            ))}
          </SortableContext>
          <DragOverlay>
            {activeItem && (
              <SortableItem
                id={getItemID(activeItem)}
                item={activeItem}
                onDelete={handleDelete}
                activityLabels={activityLabels}
              />
            )}
          </DragOverlay>
        </DndContext>
      </Box>
    </Box>
  );
};

export default ActivityListInput;

type SortableItemProps = {
  id: string;
  item: CompanyActivity | string;
  onDelete?: (item: CompanyActivity | string) => void;
  activityLabels: Label[];
};

export const SortableItem: React.FC<SortableItemProps> = ({
  id,
  item,
  onDelete,
  activityLabels,
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
        border: `1px solid black`,
        borderRadius: 2,
        padding: 10,
        margin: 2,
        alignItems: 'center',
        backgroundColor: 'white',
      }}
    >
      <Typography variant="body1" sx={{ flex: 1 }}>
        {typeof item === 'string'
          ? item
          : activityLabels.find(a => a.labelKey === item.labelKey)
              ?.baseLabelValue ?? item.labelKey}
      </Typography>
      <IconButton
        onClick={() => onDelete?.(item)}
        sx={{
          borderRadius: '50%',
        }}
      >
        <DeleteIcon />
      </IconButton>
      <Box
        {...listeners}
        {...attributes}
        sx={{
          padding: 1,
          marginRight: 1,
          backgroundColor: '#DDD',
          outline: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 1,
        }}
      >
        <DragHandle />
      </Box>
    </Box>
  );
};

const filterCompanyActivities = createFilterOptions<CompanyActivity | string>();

const getItemID = (item: CompanyActivity | string) =>
  typeof item === 'string' ? item : item.id;

const ADD_ACTIVITY_PREFIX = 'Add activity : ';
