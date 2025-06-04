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
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import { IconButton, Box, Button, Typography } from '@mui/material';
import uniqBy from 'lodash/uniqBy';
import { useEffect, useState } from 'react';
import { getImageURL } from '@azzapp/service/mediaServices/imageHelpers';
import LottiePlayer from './LottiePlayer';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import type { BoxProps } from '@mui/material';
import type { ChangeEvent } from 'react';

type MediasListInputProps = Omit<BoxProps, 'onChange'> & {
  name: string;
  label?: string;
  value: Array<File | string> | null | undefined;
  accept: string;
  error?: boolean | null;
  helperText?: string | null;
  canAdd?: boolean;
  onChange: (medias: Array<File | string>) => void;
};

const MediasListInput = ({
  name,
  label,
  value,
  accept,
  error,
  helperText,
  onChange,
  canAdd = true,
  ...props
}: MediasListInputProps) => {
  const images = value ?? [];
  const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor));
  const [activeImage, setActiveImage] = useState<File | string | null>(null);

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(uniqBy([...images, ...(event.target.files ?? [])], getImageID));
  };

  const handleImageDelete = (image: File | string) => {
    onChange(images.filter(item => item !== image));
  };

  function handleDragStart(event: DragStartEvent) {
    setActiveImage(
      images.find(image => getImageID(image) === event.active.id) ?? null,
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over?.id) {
      onChange(
        arrayMove(
          images,
          images.findIndex(image => getImageID(image) === active.id),
          images.findIndex(image => getImageID(image) === over.id),
        ),
      );
    }

    setActiveImage(null);
  }

  return (
    <Box {...props}>
      {label && <Typography variant="h6">{label}</Typography>}
      {error && <Typography color="error">{helperText}</Typography>}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
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
            items={images.map(image => getImageID(image))}
            strategy={rectSortingStrategy}
          >
            {images.map(image => (
              <SortableItem
                id={getImageID(image)}
                key={getImageID(image)}
                image={image}
                onDelete={handleImageDelete}
              />
            ))}
          </SortableContext>
          <DragOverlay>
            {activeImage && (
              <SortableItem
                id={getImageID(activeImage)}
                image={activeImage}
                onDelete={handleImageDelete}
              />
            )}
          </DragOverlay>
        </DndContext>
      </Box>
      {canAdd && (
        <Button component="label" variant="outlined">
          Add Media
          <input
            name={name}
            type="file"
            accept={accept}
            onChange={handleImageUpload}
            multiple
            hidden
          />
        </Button>
      )}
    </Box>
  );
};

export default MediasListInput;

const getImageID = (image: File | string) =>
  typeof image === 'string'
    ? image
    : hashCode(
        `${image.name}-${image.size}-${image.type}-${image.lastModified}`,
      );

type SortableItemProps = {
  id: string;
  image: File | string;
  onDelete?: (id: File | string) => void;
};

export const SortableItem: React.FC<SortableItemProps> = ({
  id,
  image,
  onDelete,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const [src, setSrc] = useState<string | null>(null);

  const kind =
    image instanceof File
      ? image.type === 'application/json'
        ? 'lottie'
        : image.type.startsWith('video')
          ? 'video'
          : 'image'
      : 'image';

  useEffect(() => {
    let urlToClean: string | null = null;
    if (typeof image === 'string') {
      setSrc(getImageURL(image));
    } else {
      const url = URL.createObjectURL(image);
      setSrc(url);
      urlToClean = url;
    }
    return () => {
      if (urlToClean) {
        URL.revokeObjectURL(urlToClean);
      }
    };
  }, [image]);

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <Box ref={setNodeRef} style={{ ...style, position: 'relative' }}>
      {kind === 'lottie' ? (
        src && (
          <LottiePlayer
            src={src}
            autoplay
            loop
            tintColor="#FF0000"
            {...attributes}
            {...listeners}
          />
        )
      ) : kind === 'video' ? (
        <video
          src={src!}
          style={{ maxWidth: 120 }}
          {...attributes}
          {...listeners}
        />
      ) : (
        <img
          src={src!}
          style={{ maxWidth: 120 }}
          {...attributes}
          {...listeners}
        />
      )}
      <IconButton
        onClick={() => onDelete?.(image)}
        sx={{
          position: 'absolute',
          top: 5,
          right: 5,
          backgroundColor: 'white',
          borderRadius: '50%',
        }}
      >
        <DeleteIcon />
      </IconButton>
    </Box>
  );
};

const hashCode = (str: string) => {
  let hash = 0;
  let i: number;
  let chr: number;
  if (str.length === 0) return '0';
  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i);
    // eslint-disable-next-line no-bitwise
    hash = (hash << 5) - hash + chr;
    // eslint-disable-next-line no-bitwise
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
};
