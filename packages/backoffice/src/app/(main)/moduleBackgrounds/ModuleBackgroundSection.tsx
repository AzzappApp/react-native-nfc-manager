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
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DisableIcon from '@mui/icons-material/HideImage';
import { IconButton, Box } from '@mui/material';
import { useState } from 'react';
import { getImageURL } from '@azzapp/service/mediaServices/imageHelpers';
import type { ModuleBackground } from '@azzapp/data';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import type { BoxProps } from '@mui/material';

type ModuleBackgroundSectionProps = Omit<BoxProps, 'onChange'> & {
  value: ModuleBackground[] | null | undefined;
  onChange: (medias: ModuleBackground[]) => void;
  onSetEnabled: (mediaId: string, enabled: boolean) => void;
};

const ModuleBackgroundSection = ({
  value,
  onChange,
  onSetEnabled,
  ...props
}: ModuleBackgroundSectionProps) => {
  const medias = value ?? [];
  const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor));
  const [activeMedia, setActiveMedia] = useState<ModuleBackground | null>(null);

  function handleDragStart(event: DragStartEvent) {
    setActiveMedia(medias.find(media => media.id === event.active.id) ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over?.id) {
      onChange(
        arrayMove(
          medias,
          medias.findIndex(media => media.id === active.id),
          medias.findIndex(media => media.id === over.id),
        ),
      );
    }

    setActiveMedia(null);
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 1,
      }}
      {...props}
    >
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        id={`medias-list-${name}`}
      >
        <SortableContext
          items={medias.map(media => media.id)}
          strategy={rectSortingStrategy}
        >
          {medias.map(media => (
            <SortableItem
              key={media.id}
              media={media}
              onSetEnabled={onSetEnabled}
            />
          ))}
        </SortableContext>
        <DragOverlay>
          {activeMedia && (
            <SortableItem media={activeMedia} onSetEnabled={onSetEnabled} />
          )}
        </DragOverlay>
      </DndContext>
    </Box>
  );
};

export default ModuleBackgroundSection;

type SortableItemProps = {
  media: ModuleBackground;
  onSetEnabled?: (id: string, enabled: boolean) => void;
};

export const SortableItem: React.FC<SortableItemProps> = ({
  media,
  onSetEnabled,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: media.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <Box
      ref={setNodeRef}
      style={{
        ...style,
        border: '1px solid black',
        position: 'relative',
      }}
    >
      <img
        src={getImageURL(media.id)}
        style={{
          maxWidth: 120,
          maxHeight: 400,
          opacity: media.enabled ? 1 : 0.5,
        }}
        {...attributes}
        {...listeners}
      />
      <IconButton
        onClick={() => onSetEnabled?.(media.id, !media.enabled)}
        sx={{
          position: 'absolute',
          top: 5,
          right: 5,
          backgroundColor: media.enabled ? 'white' : 'red',
          borderRadius: '50%',
        }}
      >
        <DisableIcon />
      </IconButton>
    </Box>
  );
};
