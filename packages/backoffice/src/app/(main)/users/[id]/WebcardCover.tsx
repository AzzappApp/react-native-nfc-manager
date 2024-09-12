'use client';

import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Typography,
} from '@mui/material';
import { getImageURLForSize, getVideoURL } from '@azzapp/shared/imagesHelpers';
import type { WebCard } from '@azzapp/data';

type Props = {
  webcard: WebCard;
  role: string;
  onRemoveWebcard: (webcardId: string) => void;
};

const WIDTH = 276;
const HEIGHT = 411;

const WebcardCover = ({ webcard, role, onRemoveWebcard }: Props) => {
  return (
    <Card sx={{ minWidth: WIDTH, margin: 1 }}>
      {webcard.coverMediaId?.startsWith('v') ? (
        <CardMedia
          sx={{ height: HEIGHT }}
          component="video"
          title={webcard.userName}
          image={getVideoURL(webcard.coverMediaId)}
          controls
        />
      ) : (
        <CardMedia
          sx={{ height: HEIGHT }}
          component="img"
          title={webcard.userName}
          image={getImageURLForSize({ id: webcard.coverMediaId || '' })}
        />
      )}
      <CardContent>
        <Typography variant="body1">name: {webcard.userName}</Typography>
        {webcard.companyName && (
          <Typography variant="subtitle2">
            Company: {webcard.companyName}
          </Typography>
        )}
        <Typography variant="subtitle2">id: {webcard.id}</Typography>
        <Typography variant="subtitle2">role: {role}</Typography>
      </CardContent>
      <CardActions>
        <Button
          variant="contained"
          color="error"
          size="small"
          onClick={() => {
            onRemoveWebcard(webcard.id);
          }}
        >
          Remove
        </Button>
      </CardActions>
    </Card>
  );
};

export default WebcardCover;
