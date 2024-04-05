'use client';

import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Typography,
} from '@mui/material';
import { getWebcardCoverUri } from '#helpers/webcard';
import type { WebCard } from '@azzapp/data';

type Props = {
  webcard: WebCard;
  onRemoveWebcard: (webcardId: string) => void;
};

const WIDTH = 276;
const HEIGHT = 411;

const WebcardCover = ({ webcard, onRemoveWebcard }: Props) => {
  return (
    <Card sx={{ minWidth: WIDTH, margin: 1 }}>
      <CardMedia
        sx={{ height: HEIGHT }}
        image={getWebcardCoverUri(
          webcard.userName,
          webcard.updatedAt.toDateString(),
          WIDTH,
          HEIGHT,
        )}
        title={webcard.userName}
      />
      <CardContent>
        <Typography variant="subtitle2">name: {webcard.userName}</Typography>
        <Typography variant="body1">id: {webcard.id}</Typography>
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
